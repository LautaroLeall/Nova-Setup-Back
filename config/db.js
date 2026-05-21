// Este archivo tiene un solo trabajo: Conectarse a MongoDB usando Mongoose.
import mongoose from 'mongoose'; // Importamos la herramienta

// Creamos una función asíncrona (porque conectarse a internet toma tiempo)
const connectDB = async () => {
    try {
        // Intentamos conectarnos usando la variable secreta MONGO_URI
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // Si sale bien, imprimimos un mensaje de éxito en la consola
        console.log(`🟢 Conectado a MongoDB Atlas! Host: ${conn.connection.host}`);
    } catch (error) {
        // Si hay un error (contraseña mal, sin internet), mostramos el error
        console.error(`❌ Error al conectar a MongoDB: ${error.message}`);
        process.exit(1); // Cerramos el servidor porque sin base de datos no podemos funcionar
    }
};

export default connectDB; // Exportamos la función para usarla en server.js