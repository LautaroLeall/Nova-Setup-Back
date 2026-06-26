import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// El cliente se inicializará dentro del controlador para asegurar que process.env esté cargado

// ─────────────────────────────────────────────
// POST /api/orders
// Crear una nueva orden en MongoDB
// ─────────────────────────────────────────────
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío." });
    }

    // Recalcular el precio en el servidor (nunca confiar en el frontend)
    let totalPrice = 0;
    const verifiedItems = [];

    for (const item of orderItems) {
      const productInDB = await Product.findById(item.product);
      if (!productInDB) {
        return res
          .status(404)
          .json({ message: `Producto no encontrado: ${item.product}` });
      }
      if (productInDB.countInStock < item.qty) {
        return res.status(400).json({
          message: `Stock insuficiente para: ${productInDB.name}`,
        });
      }

      const effectivePrice = productInDB.discountPrice ?? productInDB.price;
      totalPrice += effectivePrice * item.qty;

      verifiedItems.push({
        name: productInDB.name,
        qty: item.qty,
        image: productInDB.images[0],
        price: effectivePrice,
        product: productInDB._id,
      });
    }

    const order = new Order({
      user: req.user._id,
      orderItems: verifiedItems,
      shippingAddress,
      totalPrice: Math.round(totalPrice * 100) / 100,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error al crear orden:", error);
    res.status(500).json({ message: "Error al crear la orden." });
  }
};

// ─────────────────────────────────────────────
// POST /api/orders/mp-preference
// Generar preferencia de pago en Mercado Pago
// ─────────────────────────────────────────────
export const createMPPreference = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate("user", "email firstName lastName");
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    // Verificar que la orden pertenece al usuario autenticado
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado." });
    }

    // Inicializamos aquí adentro para asegurar que lea correctamente del .env
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const preferenceClient = new Preference(mpClient);

    const preferenceBody = {
      items: order.orderItems.map((item) => ({
        id: item.product.toString(),
        title: item.name,
        description: "Producto de Nova SetUp",
        category_id: "electronics",
        quantity: Number(item.qty),
        unit_price: Number(item.price),
        currency_id: "ARS",
      })),
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`,
      },
      external_reference: order._id.toString(),
    };

    if (process.env.BACKEND_URL) {
      preferenceBody.notification_url = `${process.env.BACKEND_URL}/api/orders/mp-webhook`;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log("Sending preferenceBody to MP:", JSON.stringify(preferenceBody, null, 2));
    }

    const preference = await preferenceClient.create({ body: preferenceBody });

    // Guardar el preference ID en la orden
    order.mpPreferenceId = preference.id;
    await order.save();

    res.json({
      preferenceId: preference.id,
      initPoint: preference.init_point, // URL de pago completa
      sandboxInitPoint: preference.sandbox_init_point, // URL de sandbox
    });
  } catch (error) {
    console.error("Error al crear preferencia MP:", error);
    res.status(500).json({ message: "Error al crear la preferencia de pago." });
  }
};

// ─────────────────────────────────────────────
// POST /api/orders/mp-webhook
// Webhook que llama Mercado Pago al recibir un pago
// ─────────────────────────────────────────────
export const mpWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // MP envía distintos tipos de notificaciones
    if (type !== "payment") {
      return res.status(200).json({ message: "Notificación no relevante, ignorada." });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(400).json({ message: "ID de pago no encontrado." });
    }

    // Obtener detalles del pago desde la API de MP
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const paymentClient = new Payment(mpClient);
    const paymentInfo = await paymentClient.get({ id: paymentId });

    // Vincular con la orden usando external_reference
    const orderId = paymentInfo.external_reference;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    // Actualizar metadata del pago siempre
    order.paymentResult = {
      mp_payment_id: paymentInfo.id.toString(),
      mp_status: paymentInfo.status,
      mp_status_detail: paymentInfo.status_detail,
      mp_payment_type: paymentInfo.payment_type_id,
    };

    if (paymentInfo.status === "approved") {
      // Evitar descontar stock doble si ya estaba procesada como pagada
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "paid";

        // Descontar el stock
        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { countInStock: -item.qty },
          });
        }
      }
    } else if (paymentInfo.status === "rejected" || paymentInfo.status === "cancelled") {
      order.status = "cancelled";
      order.isPaid = false;
    } else if (paymentInfo.status === "pending" || paymentInfo.status === "in_process") {
      order.status = "pending";
      order.isPaid = false;
    } else if (paymentInfo.status === "refunded") {
      order.status = "refunded";
      order.isPaid = false;
      // Aquí se podría restaurar el stock, pero por ahora solo actualizamos el estado
    }

    await order.save();

    console.log(`✅ Webhook procesado para orden ${orderId} con estado ${paymentInfo.status}`);
    res.status(200).json({ message: "Webhook procesado correctamente." });
  } catch (error) {
    console.error("Error en webhook MP:", error);
    res.status(500).json({ message: "Error procesando webhook." });
  }
};

// ─────────────────────────────────────────────
// GET /api/orders/:id
// Obtener los detalles de una orden específica
// ─────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    // Solo el dueño de la orden o un admin puede verla
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "No autorizado." });
    }

    res.json(order);
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({ message: "Error al obtener la orden." });
  }
};

// @desc    Obtener todas las órdenes (Solo Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id firstName lastName email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({ message: "Error al obtener las órdenes." });
  }
};

// @desc    Actualizar estado general de la orden (Solo Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, isPaid, isDelivered } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    if (status) order.status = status;

    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      if (isPaid && !order.paidAt) {
        order.paidAt = new Date();
        if (order.status === "pending") order.status = "paid";
      }
      if (!isPaid) order.paidAt = undefined;
    }

    if (isDelivered !== undefined) {
      order.isDelivered = isDelivered;
      if (isDelivered && !order.deliveredAt) {
        order.deliveredAt = new Date();
        if (order.status === "paid" || order.status === "pending") order.status = "shipped";
      }
      if (!isDelivered) order.deliveredAt = undefined;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error al actualizar estado de la orden:", error);
    res.status(500).json({ message: "Error al actualizar estado." });
  }
};

// @desc    Confirmar recepción por parte del usuario
// @route   PUT /api/orders/:id/confirm-delivery
// @access  Private
export const confirmDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    // BUG-05: Verificar que la orden esté en estado válido para confirmar entrega
    if (!['shipped', 'paid'].includes(order.status) && !order.isDelivered && !order.isPaid) {
      return res.status(400).json({ message: "La orden no puede confirmarse: no está en estado de envío o pago." });
    }

    // Verificar que la orden pertenece al usuario
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado para confirmar esta orden." });
    }

    order.isUserConfirmed = true;
    order.status = "delivered";
    if (!order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error al confirmar entrega:", error);
    res.status(500).json({ message: "Error al confirmar recepción." });
  }
};

// @desc    Obtener las órdenes del usuario logueado
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error al obtener mis órdenes:", error);
    res.status(500).json({ message: "Error al obtener tus órdenes." });
  }
};
