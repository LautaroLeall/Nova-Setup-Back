import Product from '../models/Product.js';

// @desc    Obtener todos los productos (con filtros, búsqueda y paginación)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;

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

    // Obtener los productos con el filtro, orden y paginación
    const products = await Product.find(filter)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 }); // Los más nuevos primero por defecto

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
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
