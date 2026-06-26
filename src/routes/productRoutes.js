import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  createProductReview,
  notifyRestock,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

// Rutas de reseñas (colección separada)
router.route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, createProductReview);

router.post('/:id/notify-restock', protect, notifyRestock);

export default router;
