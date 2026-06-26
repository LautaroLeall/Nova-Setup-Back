import express from "express";
import { authUser, registerUser, getUsers, deleteUser, updateUserRole, toggleFavorite, getFavorites, verifyEmail, googleAuth, forgotPassword, resetPassword, updateUserProfile } from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/google-auth", googleAuth);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// User protected routes
router.route("/profile").put(protect, updateUserProfile);
router.route("/favorites").get(protect, getFavorites);
router.route("/favorites/:productId").post(protect, toggleFavorite);

// Admin routes
router.route("/").get(protect, admin, getUsers);
router.route("/:id").delete(protect, admin, deleteUser);
router.route("/:id/role").put(protect, admin, updateUserRole);

export default router;
