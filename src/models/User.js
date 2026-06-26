import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Ahora es false para permitir login con Google
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Permite múltiples nulos sin chocar el índice único
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    shippingAddress: {
      fullName: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      province: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

// Método para verificar si el password coincide
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware para encriptar el password antes de guardar si fue modificado
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
