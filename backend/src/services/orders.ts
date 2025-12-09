import { prisma } from './prisma.js';
import { logEvent } from './events.js';
import { notifyUser, sendAdmin } from './bot.js';

export async function createOrder(userId: number, cityId: number, items: { productId: number; quantity: number }[]) {
  const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, is_active: true } });
  if (products.length !== items.length) {
    throw new Error('Invalid product');
  }
  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + product.price_huf * item.quantity;
  }, 0);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.balance_huf < total) {
    await logEvent('9_insufficient_balance', { total }, userId, true);
    throw new Error('Insufficient balance');
  }

  const order = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({ where: { id: userId }, data: { balance_huf: { decrement: total } } });
    const order = await tx.order.create({
      data: {
        user_id: userId,
        city_id: cityId,
        total_huf: total,
        status: 'paid',
      },
    });
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      await tx.orderItem.create({
        data: {
          order_id: order.id,
          product_id: product.id,
          price_huf: product.price_huf,
          quantity: item.quantity,
        },
      });
    }
    await tx.transaction.create({
      data: {
        user_id: userId,
        type: 'purchase',
        amount_huf: -total,
        metadata_json: { orderId: order.id },
      },
    });
    return { order, updatedUser };
  });
  await logEvent('5_order_created', { orderId: order.order.id, total }, userId, true);
  await logEvent('6_order_status_change', { orderId: order.order.id, status: 'paid' }, userId, true);
  await sendAdmin(`Order ${order.order.id} created for user ${userId} total ${total} HUF`);
  await notifyUser(userId, `Order ${order.order.id} placed. Total ${total} HUF.`);
  return order.order;
}

export async function updateOrderStatus(orderId: number, status: string) {
  const order = await prisma.order.update({ where: { id: orderId }, data: { status: status as any } });
  await logEvent('6_order_status_change', { orderId, status }, order.user_id, true);
  await notifyUser(order.user_id, `Order ${orderId} status updated to ${status}`);
  return order;
}
