import express from "express";
import {
  createOrder,
  createMPPreference,
  mpWebhook,
  getOrderById,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Crear una nueva orden (requiere login)
router.post("/", protect, createOrder);

// Generar preferencia de Mercado Pago (requiere login)
router.post("/mp-preference", protect, createMPPreference);

// Webhook de Mercado Pago (público — MP lo llama desde sus servidores)
router.post("/mp-webhook", mpWebhook);

// Obtener detalles de una orden (requiere login)
router.get("/:id", protect, getOrderById);

export default router;
