import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { sendRestockEmail } from '../config/mailer.js';

// Helper para sanitizar inputs de regex (SEC-04)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Obtener todos los productos (con filtros, búsqueda y paginación)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    // 1. Búsqueda por palabra clave con regex sanitizado (SEC-04)
    const keyword = req.query.keyword
      ? { name: { $regex: escapeRegex(req.query.keyword), $options: 'i' } }
      : {};

    // 2. Filtro por categoría
    const category = req.query.category ? { category: req.query.category } : {};

    // 3. Filtro por marca
    const brand = req.query.brand ? { brand: req.query.brand } : {};

    const filter = { ...keyword, ...category, ...brand };

    const count = await Product.countDocuments(filter);

    let products;
    if (req.query.pageSize === '0') {
      products = await Product.find(filter).sort({ createdAt: -1 });
    } else {
      // SEC-06: Cap máximo de pageSize para evitar volcados masivos de BD
      const pageSize = Math.min(Number(req.query.pageSize) || 12, 100);
      const page = Number(req.query.pageNumber) || 1;
      products = await Product.find(filter)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });
    }

    res.json({
      products,
      page: req.query.pageSize === '0' ? 1 : (Number(req.query.pageNumber) || 1),
      pages: req.query.pageSize === '0' ? 1 : Math.ceil(count / (Number(req.query.pageSize) || 12)),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los productos" });
  }
};

// @desc    Obtener un solo producto por ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    // BUG-03: Eliminado el autosync save() en ruta GET pública (antipatrón write en read)
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al buscar el producto" });
  }
};

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, description, brand, category, price, discountPrice, countInStock, images, badges, features } = req.body;

    if (!name || !description || !brand || !category || !price) {
      return res.status(400).json({ message: "Por favor, complete todos los campos obligatorios" });
    }

    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const product = new Product({
      name,
      slug,
      description,
      brand,
      category,
      price,
      discountPrice: discountPrice || null,
      countInStock: countInStock || 0,
      images: images || [],
      badges: badges || [],
      features: features || [],
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el producto" });
  }
};

// @desc    Actualizar un producto existente
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { name, description, brand, category, price, discountPrice, countInStock, images, badges, features } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      if (name) {
        product.slug = name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      product.description = description || product.description;
      product.brand = brand || product.brand;
      product.category = category || product.category;
      product.price = price !== undefined ? price : product.price;
      product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;

      const wasRestocked = product.countInStock === 0 && countInStock > 0;
      product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;

      product.images = images || product.images;
      product.badges = badges || product.badges;
      product.features = features || product.features;

      // BUG-02: Limpiar notifyOnRestock ANTES del primer save para evitar doble save
      const notifyList = wasRestocked ? [...product.notifyOnRestock] : [];
      if (wasRestocked) {
        product.notifyOnRestock = [];
      }

      const updatedProduct = await product.save();

      // Enviar notificaciones si fue reabastecido
      if (wasRestocked && notifyList.length > 0) {
        try {
          const populatedProduct = await Product.findById(updatedProduct._id).populate("notifyOnRestock", "email");
          const emails = notifyList
            .map(id => populatedProduct.notifyOnRestock?.find(u => u._id.toString() === id.toString())?.email)
            .filter(Boolean);

          if (emails.length > 0) {
            // MEJ-08: Usar BCC para no exponer emails entre usuarios
            await sendRestockEmail(emails, populatedProduct);
          }
        } catch (emailError) {
          console.error("Error al enviar correos de restock:", emailError.message);
        }
      }

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el producto" });
  }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Review.deleteMany({ product: product._id });
      await product.deleteOne();
      res.json({ message: 'Producto eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el producto" });
  }
};

// @desc    Obtener las reseñas de un producto
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las reseñas" });
  }
};

// @desc    Crear una nueva reseña
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment, orderId } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const userReviewsForProduct = await Review.find({ product: productId, user: req.user._id });
    const reviewedOrderIds = userReviewsForProduct.map(r => r.order?.toString()).filter(Boolean);

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let targetOrderId = orderId;

    if (targetOrderId) {
      const order = await Order.findOne({ _id: targetOrderId, user: req.user._id, status: 'delivered' });
      if (!order) return res.status(404).json({ message: 'Orden no encontrada o no ha sido entregada.' });

      const hasProduct = order.orderItems.some(item => item.product.toString() === productId.toString());
      if (!hasProduct) return res.status(400).json({ message: 'El producto no pertenece a esta compra.' });

      const timeSinceDelivery = now - new Date(order.deliveredAt).getTime();
      if (timeSinceDelivery > SEVEN_DAYS_MS) {
        return res.status(400).json({ message: 'El periodo de 7 días para calificar ha expirado.' });
      }

      if (reviewedOrderIds.includes(targetOrderId.toString())) {
        return res.status(400).json({ message: 'Ya has calificado este producto en esta compra.' });
      }
    } else {
      const orders = await Order.find({ user: req.user._id, status: 'delivered' }).sort({ deliveredAt: -1 });

      let foundOrder = null;
      for (const order of orders) {
        const hasProduct = order.orderItems.some(item => item.product.toString() === productId.toString());
        if (hasProduct && order.deliveredAt) {
          const timeSinceDelivery = now - new Date(order.deliveredAt).getTime();
          if (timeSinceDelivery <= SEVEN_DAYS_MS && !reviewedOrderIds.includes(order._id.toString())) {
            foundOrder = order;
            break;
          }
        }
      }

      if (!foundOrder) {
        return res.status(400).json({ message: 'No tienes compras recientes disponibles para calificar este producto.' });
      }
      targetOrderId = foundOrder._id;
    }

    await Review.create({
      product: productId,
      user: req.user._id,
      order: targetOrderId,
      firstName: req.user.firstName,
      rating: Number(rating),
      comment: comment || '',
    });

    // Marcar el item de la orden como reseñado
    const finalOrder = await Order.findById(targetOrderId);
    if (finalOrder) {
      let orderUpdated = false;
      for (const item of finalOrder.orderItems) {
        if (item.product.toString() === productId.toString() && !item.isReviewed) {
          item.isReviewed = true;
          orderUpdated = true;
        }
      }
      if (orderUpdated) await finalOrder.save();
    }

    // Recalcular rating y numReviews
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      product.rating = Math.round(stats[0].avgRating * 10) / 10;
      product.numReviews = stats[0].count;
    }

    await product.save();

    res.status(201).json({ message: 'Reseña agregada exitosamente' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya has calificado este producto.' });
    }
    res.status(500).json({ message: "Error al crear la reseña" });
  }
};

// @desc    Suscribirse a notificación de restock
// @route   POST /api/products/:id/notify-restock
// @access  Private
export const notifyRestock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (!product.notifyOnRestock.includes(req.user._id)) {
      product.notifyOnRestock.push(req.user._id);
      await product.save();
    }

    res.status(200).json({ message: 'Te notificaremos cuando haya stock.' });
  } catch (error) {
    res.status(500).json({ message: "Error al suscribirse" });
  }
};
