import { FastifyInstance } from 'fastify';
import { createOrder, updateOrderStatus } from '../services/orders.js';
import { prisma } from '../services/prisma.js';

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post('/orders', async (request, reply) => {
    const body = request.body as { userId: number; cityId: number; items: { productId: number; quantity: number }[] };
    try {
      const order = await createOrder(body.userId, body.cityId, body.items);
      return { order };
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  fastify.get('/orders/:userId', async (request) => {
    const params = request.params as { userId: string };
    return prisma.order.findMany({ where: { user_id: Number(params.userId) }, include: { items: true, city: true } });
  });

  fastify.post('/orders/:id/status', async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { status: string };
    return updateOrderStatus(Number(params.id), body.status);
  });
}
