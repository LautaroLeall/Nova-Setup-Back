import express from "express";
import {
  createOrder,
  createMPPreference,
  mpWebhook,
  getOrderById,
  getOrders,
  updateOrderStatus,
  confirmDelivery,
  getMyOrders,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Crear una nueva orden / Listar todas las órdenes (Admin)
router.route("/")
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// Generar preferencia de Mercado Pago (requiere login)
router.post("/mp-preference", protect, createMPPreference);

// Webhook de Mercado Pago (público)
router.post("/mp-webhook", mpWebhook);

// Obtener las órdenes del usuario logueado (importante colocar antes de /:id)
router.get("/myorders", protect, getMyOrders);

// Obtener detalles de una orden (requiere login)
router.get("/:id", protect, getOrderById);

// Actualizar estado completo de la orden (Solo Admin)
router.put("/:id/status", protect, admin, updateOrderStatus);

// Confirmar recepción (Usuario)
router.put("/:id/confirm-delivery", protect, confirmDelivery);

export default router;
