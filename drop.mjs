import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    await mongoose.connection.collection('reviews').dropIndex('product_1_user_1');
    console.log('Index dropped successfully');
  } catch(e) {
    console.log('Error or already dropped: ' + e.message);
  }
  process.exit();
});
