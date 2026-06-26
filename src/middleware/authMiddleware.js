import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      // BUG-06: Si el usuario fue eliminado de la BD pero tiene JWT válido
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado, usuario no encontrado" });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "No autorizado, token inválido" });
    }
  }

  // SEC-05: return explícito para evitar doble respuesta
  return res.status(401).json({ message: "No autorizado, no hay token" });
};

// INC-01: Cambiar 401 → 403 (autenticado pero sin permisos de admin)
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Prohibido: se requiere rol administrador" });
  }
};

export { protect, admin };
