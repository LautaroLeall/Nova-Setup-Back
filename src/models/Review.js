import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      // Opcional para no romper reseñas antiguas, pero se exigirá en las nuevas
    },
    firstName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Índice único: un usuario solo puede tener 1 reseña por producto POR COMPRA
// Al agregar 'order' al índice, permitimos múltiples reseñas si pertenecen a órdenes distintas.
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
