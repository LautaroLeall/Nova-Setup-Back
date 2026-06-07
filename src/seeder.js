import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import Product from "./models/Product.js";
import User from "./models/User.js";
import { products } from "./data/products.js";
import connectDB from "./config/db.js";

dotenv.config();

connectDB();

const importData = async () => {
  try {
    // 1. Limpiar base de datos para no duplicar datos
    await Product.deleteMany();
    // await User.deleteMany(); // Opcionalmente podríamos limpiar usuarios y crear un admin

    // 2. Opcional: Asignar un usuario admin a cada producto (si el schema lo requiere a futuro)
    // const createdUsers = await User.insertMany(users);
    // const adminUser = createdUsers[0]._id;
    // const sampleProducts = products.map((p) => {
    //   return { ...p, user: adminUser };
    // });

    // 3. Insertar productos
    await Product.insertMany(products);

    console.log("Datos Importados a MongoDB!".green.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();

    console.log("Datos Destruidos!".red.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
