import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { sendRestockEmail } from '../config/mailer.js';

// @desc    Obtener todos los productos (con filtros, búsqueda y paginación)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {

    // 1. Búsqueda por palabra clave (en el nombre)
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i', // case-insensitive
          },
        }
      : {};

    // 2. Filtro por categoría
    const category = req.query.category ? { category: req.query.category } : {};

    // 3. Filtro por marca
    const brand = req.query.brand ? { brand: req.query.brand } : {};

    // Combinar todos los filtros
    const filter = { ...keyword, ...category, ...brand };

    // Contar total de productos que coinciden con el filtro
    const count = await Product.countDocuments(filter);

    let products;
    if (req.query.pageSize === '0') {
      // Si se pasa pageSize=0, devolver todos los productos sin límite
      products = await Product.find(filter).sort({ createdAt: -1 });
    } else {
      const pageSize = Number(req.query.pageSize) || 12;
      const page = Number(req.query.pageNumber) || 1;
      // Obtener los productos con el filtro, orden y paginación
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
    res.status(500).json({ message: "Error al obtener los productos", error: error.message });
  }
};

// @desc    Obtener un solo producto por ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al buscar el producto", error: error.message });
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
    res.status(500).json({ message: "Error al crear el producto", error: error.message });
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
      
      let wasRestocked = false;
      if (product.countInStock === 0 && countInStock > 0) {
        wasRestocked = true;
      }
      product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
      
      product.images = images || product.images;
      product.badges = badges || product.badges;
      product.features = features || product.features;

      const updatedProduct = await product.save();

      // Enviar notificaciones si fue reabastecido
      if (wasRestocked && updatedProduct.notifyOnRestock.length > 0) {
        try {
          const populatedProduct = await Product.findById(updatedProduct._id).populate("notifyOnRestock", "email");
          const emails = populatedProduct.notifyOnRestock.map(u => u.email).filter(e => e);
          if (emails.length > 0) {
            await sendRestockEmail(emails, populatedProduct);
          }
          // Limpiar la lista después de notificar
          updatedProduct.notifyOnRestock = [];
          await updatedProduct.save();
        } catch (error) {
          console.error("Error al enviar correos de restock:", error);
        }
      }

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el producto", error: error.message });
  }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // También eliminamos todas las reseñas asociadas al producto
      await Review.deleteMany({ product: product._id });
      await product.deleteOne();
      res.json({ message: 'Producto eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el producto", error: error.message });
  }
};

// @desc    Obtener las reseñas de un producto (colección separada)
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las reseñas", error: error.message });
  }
};

// @desc    Crear una nueva reseña (colección separada)
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment, orderId } = req.body;
    const productId = req.params.id;

    // 1. Verificar que el producto existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // 2. Obtener todas las reseñas del usuario para este producto
    const userReviewsForProduct = await Review.find({ product: productId, user: req.user._id });
    const reviewedOrderIds = userReviewsForProduct.map(r => r.order?.toString()).filter(Boolean);

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let targetOrderId = orderId;

    if (targetOrderId) {
      // 3a. Verificar la orden específica proporcionada
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
      // 3b. Si no se provee orderId (e.g. desde ProductDetail), buscar una orden válida automáticamente
      const orders = await Order.find({ user: req.user._id, status: 'delivered' }).sort({ deliveredAt: -1 });
      
      let foundOrder = null;
      for (const order of orders) {
        const hasProduct = order.orderItems.some(item => item.product.toString() === productId.toString());
        if (hasProduct && order.deliveredAt) {
          const timeSinceDelivery = now - new Date(order.deliveredAt).getTime();
          if (timeSinceDelivery <= SEVEN_DAYS_MS) {
            if (!reviewedOrderIds.includes(order._id.toString())) {
              foundOrder = order;
              break;
            }
          }
        }
      }

      if (!foundOrder) {
        return res.status(400).json({ message: 'No tienes compras recientes disponibles para calificar este producto.' });
      }
      targetOrderId = foundOrder._id;
    }

    // 4. Crear la reseña en la colección separada, atada a la orden
    await Review.create({
      product: productId,
      user: req.user._id,
      order: targetOrderId,
      firstName: req.user.firstName,
      rating: Number(rating),
      comment: comment || '',
    });

    // 4.5 Marcar el item de la orden como reseñado
    const finalOrder = await Order.findById(targetOrderId);
    if (finalOrder) {
      // Como un producto podría estar varias veces en la orden (aunque agrupado por cantidad),
      // actualizamos todos los ítems coincidentes.
      let orderUpdated = false;
      for (const item of finalOrder.orderItems) {
        if (item.product.toString() === productId.toString() && !item.isReviewed) {
          item.isReviewed = true;
          orderUpdated = true;
        }
      }
      if (orderUpdated) {
        await finalOrder.save();
      }
    }

    // 5. Recalcular rating y numReviews en el producto (campos denormalizados)
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      product.rating = Math.round(stats[0].avgRating * 10) / 10;
      product.numReviews = stats[0].count;
    }

    await product.save();

    res.status(201).json({ message: 'Reseña agregada exitosamente' });
  } catch (error) {
    // Error 11000 = duplicate key (índice único product+user)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya has calificado este producto.' });
    }
    res.status(500).json({ message: "Error al crear la reseña", error: error.message });
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
    res.status(500).json({ message: "Error al suscribirse", error: error.message });
  }
};
