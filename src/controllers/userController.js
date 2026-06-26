import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/mailer.js";
import axios from "axios";
import jwt from "jsonwebtoken";

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Por favor, ingrese correo y contraseña" });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isEmailVerified) {
        return res.status(401).json({ message: "Por favor, verifica tu correo electrónico antes de iniciar sesión" });
      }

      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
        shippingAddress: user.shippingAddress,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Email o contraseña incorrectos" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Email inválido" });
  }

  try {
    let userExists = await User.findOne({ email });

    if (userExists) {
      if (!userExists.isEmailVerified) {
        // Limpiar el usuario no verificado antiguo si existía (por la lógica vieja)
        await userExists.deleteOne();
      } else {
        return res.status(400).json({ message: "El usuario ya existe" });
      }
    }

    // 2. Crear un token temporal (JWT) con los datos del usuario. Expira en 1 hora.
    const tempToken = jwt.sign(
      { firstName, lastName, email, password },
      process.env.JWT_SECRET || "secreto_temporal_nova_setup",
      { expiresIn: "1h" }
    );

    // 3. Enviar el correo con este token
    await sendVerificationEmail(email, tempToken);
    
    res.status(200).json({ message: "Usuario registrado con éxito. Por favor revisa tu bandeja de entrada para verificar tu cuenta." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.isAdmin) {
        return res.status(400).json({ message: "No se puede eliminar a un administrador" });
      }
      await user.deleteOne();
      res.json({ message: "Usuario eliminado" });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

// @desc    Promover/Quitar rol de admin
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
      
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar rol" });
  }
};

// @desc    Actualizar perfil de usuario
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.shippingAddress) {
        user.shippingAddress = {
          fullName: req.body.shippingAddress.fullName || user.shippingAddress?.fullName || "",
          address: req.body.shippingAddress.address || user.shippingAddress?.address || "",
          city: req.body.shippingAddress.city || user.shippingAddress?.city || "",
          postalCode: req.body.shippingAddress.postalCode || user.shippingAddress?.postalCode || "",
          province: req.body.shippingAddress.province || user.shippingAddress?.province || "",
          phone: req.body.shippingAddress.phone || user.shippingAddress?.phone || "",
        };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        shippingAddress: updatedUser.shippingAddress,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error("Error en updateUserProfile:", error);
    res.status(500).json({ message: "Error al actualizar el perfil" });
  }
};

// @desc    Añadir o remover un producto de favoritos
// @route   POST /api/users/favorites/:productId
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    if (user) {
      if (!user.favorites) {
        user.favorites = [];
      }

      const isFavorited = user.favorites.some((id) => id.toString() === productId.toString());

      if (isFavorited) {
        user.favorites = user.favorites.filter((id) => id.toString() !== productId.toString());
      } else {
        user.favorites.push(productId);
      }

      await user.save();
      res.json(user.favorites);
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error("Error en toggleFavorite:", error);
    res.status(500).json({ message: "Error al actualizar favoritos", error: error.message });
  }
};

// @desc    Obtener los productos favoritos del usuario logueado
// @route   GET /api/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favorites");
    if (user) {
      res.json(user.favorites);
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al obtener favoritos" });
  }
};

// @desc    Verificar email
// @route   GET /api/users/verify/:token
// @access  Public
const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto_temporal_nova_setup");
    
    const userExists = await User.findOne({ email: decoded.email });
    if (userExists) {
      if (userExists.isEmailVerified) {
        return res.status(400).json({ message: "El correo ya ha sido verificado anteriormente. Puedes iniciar sesión." });
      } else {
        await userExists.deleteOne();
      }
    }

    await User.create({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      password: decoded.password, // Mongoose pre-save middleware will hash it
      isEmailVerified: true,
    });

    res.json({ message: "Email verificado correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "El enlace de verificación ha expirado. Por favor, regístrate de nuevo." });
    }
    return res.status(400).json({ message: "Enlace inválido o corrupto." });
  }
};

// @desc    Login/Register con Google
// @route   POST /api/users/google-auth
// @access  Public
const googleAuth = async (req, res) => {
  const { tokenId } = req.body; // In implicit flow from React, this is an access_token
  if (!tokenId) return res.status(400).json({ message: "Falta el token de Google" });

  try {
    // Usamos el access_token para obtener la información del usuario de la API de Google
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenId}`,
      },
    });
    
    const { email, given_name, family_name, sub } = data;
    
    if (!email) {
      return res.status(400).json({ message: "No se pudo obtener el email de Google" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName: given_name || "Usuario",
        lastName: family_name || "Google",
        email,
        googleId: sub,
        isEmailVerified: true,
      });
    } else {
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }
    }
    
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      shippingAddress: user.shippingAddress,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Error en google auth:", error.stack || error.message);
    res.status(401).json({ message: "Fallo la autenticación con Google" });
  }
};

// @desc    Solicitar reseteo de contraseña
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "El correo es requerido" });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Retornamos 200 siempre por seguridad (para no revelar qué correos existen)
      return res.json({ message: "Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña." });
    }

    if (!user.password && user.googleId) {
       return res.status(400).json({ message: "Iniciaste sesión con Google, no tienes contraseña. Inicia sesión con Google." });
    }

    // Generar token JWT válido por 15m
    const resetToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET || "secreto_temporal_nova_setup",
      { expiresIn: "15m" }
    );

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: "Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al solicitar restablecimiento de contraseña" });
  }
};

// @desc    Restablecer contraseña
// @route   PUT /api/users/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto_temporal_nova_setup");
    
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    user.password = password; // Se aplicará el hash en el pre-save de mongoose
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "El enlace ha expirado. Por favor solicita otro." });
    }
    return res.status(400).json({ message: "Enlace inválido o corrupto." });
  }
};

export { authUser, registerUser, getUsers, deleteUser, updateUserRole, toggleFavorite, getFavorites, verifyEmail, googleAuth, forgotPassword, resetPassword, updateUserProfile };
