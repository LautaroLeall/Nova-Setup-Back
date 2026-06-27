import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
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

      generateToken(res, user._id);

      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
        shippingAddress: user.shippingAddress,
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
        await userExists.deleteOne();
      } else {
        return res.status(400).json({ message: "El usuario ya existe" });
      }
    }

    // SEC-02: Hashear la contraseña ANTES de incluirla en el JWT
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const tempToken = jwt.sign(
      { firstName, lastName, email, password: hashedPassword },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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

      generateToken(res, updatedUser._id);

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        shippingAddress: updatedUser.shippingAddress,
      });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el perfil" });
  }
};

// @desc    Verificar email y crear la cuenta definitiva
// @route   GET /api/users/verify/:token
// @access  Public
const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userExists = await User.findOne({ email: decoded.email });
    if (userExists) {
      if (userExists.isEmailVerified) {
        return res.status(400).json({ message: "El correo ya ha sido verificado anteriormente. Puedes iniciar sesión." });
      } else {
        await userExists.deleteOne();
      }
    }

    // SEC-02 + BUG-04: La contraseña ya viene hasheada desde registerUser.
    // Usamos directamente sin que el pre-save la hashee de nuevo.
    // Para esto, usamos Model.create() con el campo ya hasheado y 
    // aprovechamos que el pre-save solo hashea si isModified('password'),
    // pero como es un documento nuevo, lo hacemos con save() después de setear directamente.
    const newUser = new User({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      isEmailVerified: true,
    });
    // Asignamos la contraseña ya hasheada directamente en el objeto interno
    // sin pasar por pre-save (usando set en la BD directamente via findOneAndUpdate sería más seguro,
    // pero como el pre-save verifica isModified, funciona correctamente):
    newUser.password = decoded.password; 
    // NOTA: El pre-save de bcrypt verifica isModified('password').
    // Como es un documento nuevo (isNew=true), isModified retorna true,
    // lo cual causaría doble hash. Por eso hacemos el siguiente bypass:
    newUser.$ignore = ['password']; // No es un método real de mongoose
    
    // La forma más segura: usar insertOne directo para evitar el middleware
    const User2 = User;
    await User2.collection.insertOne({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      password: decoded.password, // Ya hasheada desde registerUser
      isEmailVerified: true,
      isAdmin: false,
      favorites: [],
      shippingAddress: { fullName: "", address: "", city: "", postalCode: "", province: "", phone: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
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
  const { tokenId } = req.body;
  if (!tokenId) return res.status(400).json({ message: "Falta el token de Google" });

  try {
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenId}` },
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
      // SEC-08: Actualizar googleId si no estaba guardado
      let needsSave = false;
      if (!user.isEmailVerified) { user.isEmailVerified = true; needsSave = true; }
      if (!user.googleId) { user.googleId = sub; needsSave = true; }
      if (needsSave) await user.save();
    }

    generateToken(res, user._id);

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      shippingAddress: user.shippingAddress,
    });
  } catch (error) {
    console.error("Error en google auth:", error.message);
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
      // Anti-enumeración: siempre 200 aunque el email no exista
      return res.json({ message: "Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña." });
    }

    if (!user.password && user.googleId) {
      return res.status(400).json({ message: "Iniciaste sesión con Google, no tienes contraseña. Inicia sesión con Google." });
    }

    const resetToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    user.password = password; // pre-save aplicará el hash
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "El enlace ha expirado. Por favor solicita otro." });
    }
    return res.status(400).json({ message: "Enlace inválido o corrupto." });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
  });
  res.status(200).json({ message: "Sesión cerrada correctamente" });
};

export { authUser, registerUser, getUsers, deleteUser, updateUserRole, verifyEmail, googleAuth, forgotPassword, resetPassword, updateUserProfile, logoutUser };
