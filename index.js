// Importamos las herramientas que instalamos
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Importamos nuestra función para conectar a la base de datos
import connectDB from './config/db.js';

// 1. Configurar dotenv para poder leer el archivo .env
dotenv.config();

// 2. Conectar a la base de datos MongoDB
connectDB();

// 3. Inicializar Express (Nuestro "cocinero")
const app = express();

// 4. Middlewares (Reglas de la cocina)
app.use(cors()); // Permitimos que React nos haga peticiones
app.use(express.json()); // Permitimos que el servidor entienda datos en formato JSON

// 5. Rutas Básicas (El "menú")
// Cuando alguien entre a "http://localhost:5000/", el servidor responde esto:
app.get('/', (req, res) => {
    res.send('¡La API de Nova SetUp está funcionando a la perfección! 🚀');
});

// 6. Encender el servidor
const PORT = process.env.PORT || 5000; // Usamos el puerto del .env o el 5000 por defecto

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});