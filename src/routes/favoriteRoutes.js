import express from "express";
import { getFavorites, toggleFavorite } from "../controllers/favoriteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getFavorites);
router.route("/:productId").post(protect, toggleFavorite);

export default router;
