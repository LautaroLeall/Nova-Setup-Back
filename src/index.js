import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";

// 1. Configurar dotenv y conectar BD (primero que todo)
dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://nova-setup.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '¡La API de Nova SetUp está funcionando! 🚀' });
});

// Rutas
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/favorites", favoriteRoutes);

// MEJ-01: Middleware de error global — captura errores no manejados
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});