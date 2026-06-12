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
      // notification_url solo se agrega si tenemos una URL pública (no localhost)
      // En producción: descomentar y poner tu dominio real
      // notification_url: `${process.env.BACKEND_URL}/api/orders/mp-webhook`,
    };

    console.log("Sending preferenceBody to MP:", JSON.stringify(preferenceBody, null, 2));

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
    const paymentClient = new Payment(mpClient);
    const paymentInfo = await paymentClient.get({ id: paymentId });

    if (paymentInfo.status !== "approved") {
      return res.status(200).json({ message: `Pago no aprobado: ${paymentInfo.status}` });
    }

    // Vincular con la orden usando external_reference
    const orderId = paymentInfo.external_reference;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    // Actualizar la orden a pagada
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "paid";
    order.paymentResult = {
      mp_payment_id: paymentInfo.id.toString(),
      mp_status: paymentInfo.status,
      mp_status_detail: paymentInfo.status_detail,
      mp_payment_type: paymentInfo.payment_type_id,
    };
    await order.save();

    // Descontar el stock de cada producto comprado
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.qty },
      });
    }

    console.log(`✅ Pago aprobado para orden ${orderId}`);
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
