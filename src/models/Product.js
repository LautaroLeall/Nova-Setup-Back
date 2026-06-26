import mongoose from "mongoose";

const featureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true }
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    images: [
      {
        type: String,
        required: true,
      }
    ],
    badges: [
      {
        type: String,
      }
    ],
    features: [featureSchema],
    // rating y numReviews son campos calculados/denormalizados.
    // Se actualizan cada vez que se crea una reseña en la colección "reviews".
    // Esto evita hacer un JOIN costoso al listar productos en la tienda.
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    notifyOnRestock: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Indexación para mejorar el rendimiento de la búsqueda
productSchema.index({ name: 'text', category: 1, brand: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
