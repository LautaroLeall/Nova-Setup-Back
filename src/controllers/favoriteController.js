import Favorite from "../models/Favorite.js";

// @desc    Obtener todos los favoritos del usuario logueado
// @route   GET /api/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate("product");
    // Devolvemos solo los productos (populados)
    const products = favorites.map((f) => f.product).filter(Boolean);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener favoritos", error: error.message });
  }
};

// @desc    Agregar o quitar un producto de favoritos (toggle)
// @route   POST /api/favorites/:productId
// @access  Private
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const existing = await Favorite.findOne({ user: userId, product: productId });

    if (existing) {
      // Ya existe → quitar de favoritos
      await existing.deleteOne();
    } else {
      // No existe → agregar a favoritos
      await Favorite.create({ user: userId, product: productId });
    }

    // Devolver la lista actualizada de IDs de productos favoritos
    const favorites = await Favorite.find({ user: userId }).select("product");
    const favoriteIds = favorites.map((f) => f.product.toString());

    res.json(favoriteIds);
  } catch (error) {
    console.error("Error en toggleFavorite:", error);
    res.status(500).json({ message: "Error al actualizar favoritos", error: error.message });
  }
};
