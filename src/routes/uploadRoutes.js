import express from 'express';
import { upload } from '../config/cloudinary.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint para subir una imagen a Cloudinary (Solo Admins)
router.post('/', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
  }
  res.json({
    message: 'Imagen subida correctamente',
    url: req.file.path // multer-storage-cloudinary guarda la url de la imagen en req.file.path
  });
});

export default router;
