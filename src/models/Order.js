import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  isReviewed: { type: Boolean, default: false },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, required: true },
      phone: { type: String },
    },
    totalPrice: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "failed", "cancelled"],
      default: "pending",
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    isUserConfirmed: { type: Boolean, default: false }, // Agregado para confirmación del usuario
    paymentResult: {
      mp_payment_id: { type: String },
      mp_status: { type: String },
      mp_status_detail: { type: String },
      mp_payment_type: { type: String },
    },
    mpPreferenceId: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
