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

    for (const r of reviews) {
      if (r.order) {
        usedOrders.add(r.order.toString());
        // Aun si ya tiene orderId, debemos asegurarnos de que el OrderItem en la BD tenga isReviewed=true
        await Order.updateOne(
          { _id: r.order, "orderItems.product": r.product },
          { $set: { "orderItems.$.isReviewed": true } }
        );
        updated++;
        continue;
      }

      // Encontrar todas las órdenes entregadas para este usuario y producto
      const orders = await Order.find({ user: r.user, status: 'delivered' }).sort({ deliveredAt: -1 }).toArray();
      
      let targetOrder = null;
      for (const order of orders) {
        const orderIdStr = order._id.toString();
        // Skip if this order is already assigned to another review
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
        console.log('No order found for review:', r._id);
      }
    }
    console.log('Migracion completada. Reseñas procesadas: ' + updated);
  } catch(e) {
    console.log('Error: ' + e.message);
  }
  process.exit();
});
