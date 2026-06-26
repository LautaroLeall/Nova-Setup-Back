# ⚙️ Nova SetUp - API REST

Backend escalable y seguro desarrollado para la plataforma e-commerce **Nova SetUp**.
Provee toda la lógica de negocio, bases de datos y seguridad requerida para gestionar productos, usuarios, compras y simulación de ensamblajes en tiempo real.

> **El motor de alto rendimiento que impulsa todo tu Setup.**

---

## 🌐 Ver API Online

[![Nova SetUp Backend](https://img.shields.io/badge/Nova%20SetUp%20Backend-6d28d9?style=for-the-badge&logo=render&logoColor=white)](https://nova-setup.onrender.com)

---

## 📌 Características Principales

- ✅ **Autenticación JWT Segura**  
  Implementación de JSON Web Tokens con Bcrypt para el encriptado de contraseñas. Incluye verificación de correos y recuperación de contraseña segura vía email transaccional.

- ✅ **Gestión de Roles y Permisos**  
  Middleware de seguridad estricto que separa accesos públicos, accesos de usuarios registrados (historial, compras, carrito) y roles de Administrador (gestión de stock, órdenes, y usuarios).

- ✅ **Upload a la Nube (Cloudinary)**  
  Integración de Multer y Cloudinary para almacenar y procesar de manera eficiente y escalable las imágenes de todos los productos y componentes subidos desde el panel administrativo.

- ✅ **Procesamiento de Órdenes y Feedback**  
  Manejo estructurado de órdenes de compra con control de estado (Pendiente, Pagado, Entregado).
  Los usuarios pueden dejar múltiples reseñas de productos verificadas.

- ✅ **Paginación, Filtros y Búsqueda**  
  Consultas eficientes en Mongoose para devolver listas de productos filtradas por marca, categoría, búsquedas por texto libre y paginación desde la base de datos (Server-side rendering approach para datos).

---

## 🛠️ Tecnologías Utilizadas

- **Node.js & Express** _(Servidor web robusto y asíncrono)_
- **MongoDB & Mongoose** _(Base de datos NoSQL ágil e ideal para e-commerce)_
- **Bcryptjs & JWT** _(Seguridad criptográfica de credenciales y sesión)_
- **Cloudinary** _(Almacenamiento de assets gráficos)_
- **Nodemailer** _(Integración de envío de e-mails para resets de clave)_
- **Multer** _(Procesamiento de archivos en formularios Multi-part)_

---

## 📂 Estructura del Proyecto Backend

```text
/src
├── config
│   ├── cloudinary.js      # (Credenciales de proveedor de nube)
│   ├── db.js              # (Conexión MongoDB)
│   └── mailer.js          # (Transporte Nodemailer SMTP)
│
├── controllers
│   ├── favoriteController.js
│   ├── orderController.js # (Cálculo total, estados de orden)
│   ├── productController.js # (CRUD, filtros, paginación, reseñas)
│   └── userController.js  # (Auth, perfiles, emails)
│
├── middleware
│   └── authMiddleware.js  # (Protección de rutas, verifyToken, isAdmin)
│
├── models
│   ├── Favorite.js
│   ├── Order.js
│   ├── Product.js
│   ├── Review.js
│   └── User.js
│
├── routes
│   ├── favoriteRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   ├── uploadRoutes.js    # (Endpoint dedicado de imágenes)
│   └── userRoutes.js
│
├── scripts
│   └── seed_pc.js         # (Script utilitario para poblar BBDD con componentes)
│
├── utils
│   └── generateToken.js
│
└── index.js               # (Punto de entrada de la app, registro de rutas)
```

---

## 🚀 Instalación y Uso Local

### 1️⃣ Clonar el repositorio y acceder a Back

```bash
git clone https://github.com/LautaroLeall/E-commerce.git
cd E-commerce/Back
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Variables de Entorno (.env)

Crea un archivo `.env` en la raíz de `/Back` con la siguiente estructura:

```env
PORT=5000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster...
JWT_SECRET=tu_secreto_super_seguro
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
FRONTEND_URL=http://localhost:5173
```

### 4️⃣ Iniciar el servidor

```bash
# Modo desarrollo (Nodemon)
npm run dev

# Modo producción
npm start
```

---
