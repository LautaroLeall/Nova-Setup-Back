import express from "express";
import rateLimit from "express-rate-limit";
import { authUser, registerUser, getUsers, deleteUser, updateUserRole, verifyEmail, googleAuth, forgotPassword, resetPassword, updateUserProfile, logoutUser } from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Demasiados intentos desde esta IP, por favor intenta de nuevo en 15 minutos." }
});

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, authUser);
router.post("/logout", logoutUser);
router.post("/google-auth", googleAuth);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", authLimiter, forgotPassword);
router.put("/reset-password/:token", resetPassword);

// User protected routes
router.route("/profile").put(protect, updateUserProfile);

// Admin routes
router.route("/").get(protect, admin, getUsers);
router.route("/:id").delete(protect, admin, deleteUser);
router.route("/:id/role").put(protect, admin, updateUserRole);

export default router;
