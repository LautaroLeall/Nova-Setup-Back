import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    // Necesitamos cargar los modelos
    const Review = mongoose.connection.db.collection('reviews');
    const Order = mongoose.connection.db.collection('orders');

    const reviews = await Review.find({}).toArray();
    let updated = 0;

    for (const r of reviews) {
      // Encontrar la orden más reciente entregada para este usuario y producto
      const orders = await Order.find({ user: r.user, status: 'delivered' }).sort({ deliveredAt: -1 }).toArray();
      
      let targetOrder = null;
      for (const order of orders) {
        // Find inside array
        const hasProduct = order.orderItems.some(i => i.product.toString() === r.product.toString());
        if (hasProduct) {
          targetOrder = order;
          break;
        }
      }

      if (targetOrder) {
        // Actualizar la reseña para que tenga el orderId (si no lo tiene)
        if (!r.order) {
          await Review.updateOne({ _id: r._id }, { $set: { order: targetOrder._id } });
        }

        // Actualizar el item dentro de orderItems
        await Order.updateOne(
          { _id: targetOrder._id, "orderItems.product": r.product },
          { $set: { "orderItems.$.isReviewed": true } }
        );
        updated++;
      }
    }
    console.log('Migracion completada. Reseñas actualizadas: ' + updated);
  } catch(e) {
    console.log('Error: ' + e.message);
  }
  process.exit();
});
