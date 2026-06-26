import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const Review = mongoose.connection.db.collection('reviews');
    const Order = mongoose.connection.db.collection('orders');

    const reviews = await Review.find({}).toArray();
    let updated = 0;
    const usedOrders = new Set();

    // Pass 1: Registrar todos los orders que ya están en uso
    for (const r of reviews) {
      if (r.order) {
        usedOrders.add(r.order.toString());
      }
    }

    // Pass 2: Asignar órdenes a reseñas sin order
    for (const r of reviews) {
      if (r.order) {
        // Asegurarnos de marcar el orderItem como isReviewed=true
        await Order.updateOne(
          { _id: r.order, "orderItems.product": r.product },
          { $set: { "orderItems.$.isReviewed": true } }
        );
        updated++;
        continue;
      }

      const orders = await Order.find({ user: r.user, status: 'delivered' }).sort({ deliveredAt: -1 }).toArray();
      
      let targetOrder = null;
      for (const order of orders) {
        const orderIdStr = order._id.toString();
        if (usedOrders.has(orderIdStr)) continue;

        const hasProduct = order.orderItems.some(i => i.product.toString() === r.product.toString());
        if (hasProduct) {
          targetOrder = order;
          break;
        }
      }

      if (targetOrder) {
        await Review.updateOne({ _id: r._id }, { $set: { order: targetOrder._id } });
        await Order.updateOne(
          { _id: targetOrder._id, "orderItems.product": r.product },
          { $set: { "orderItems.$.isReviewed": true } }
        );
        usedOrders.add(targetOrder._id.toString());
        updated++;
      } else {
        // Si no hay orden disponible, simplemente eliminamos la reseña huerfana o la dejamos.
        // Como no tiene orden y el index es unique con order, podría quedar con order: null.
        console.log('No order found for old review:', r._id);
      }
    }
    console.log('Migracion completada. Reseñas procesadas: ' + updated);
  } catch(e) {
    console.log('Error: ' + e.message);
  }
  process.exit();
});
