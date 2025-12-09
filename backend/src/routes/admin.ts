import { FastifyInstance } from 'fastify';
import { prisma } from '../services/prisma.js';
import { adjustBalance } from '../services/users.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/stats', async () => {
    const users = await prisma.user.count();
    const orders = await prisma.order.count();
    const pending = await prisma.order.count({ where: { status: 'pending' } });
    return { users, orders, pending };
  });

  fastify.post('/admin/cities', async (request) => {
    const body = request.body as { name: string; is_active?: boolean };
    return prisma.city.create({ data: { name: body.name, is_active: body.is_active ?? true } });
  });
  fastify.put('/admin/cities/:id', async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { name?: string; is_active?: boolean };
    return prisma.city.update({ where: { id: Number(params.id) }, data: body });
  });
  fastify.delete('/admin/cities/:id', async (request) => {
    const params = request.params as { id: string };
    return prisma.city.delete({ where: { id: Number(params.id) } });
  });

  fastify.post('/admin/products', async (request) => {
    const body = request.body as { city_id: number; name: string; description: string; price_huf: number; images: string[]; address: string; is_active?: boolean };
    return prisma.product.create({ data: { ...body, is_active: body.is_active ?? true } });
  });
  fastify.put('/admin/products/:id', async (request) => {
    const params = request.params as { id: string };
    const body = request.body as Partial<{ city_id: number; name: string; description: string; price_huf: number; images: string[]; address: string; is_active: boolean }>;
    return prisma.product.update({ where: { id: Number(params.id) }, data: body });
  });
  fastify.delete('/admin/products/:id', async (request) => {
    const params = request.params as { id: string };
    return prisma.product.delete({ where: { id: Number(params.id) } });
  });

  fastify.get('/admin/users', async () => prisma.user.findMany());
  fastify.get('/admin/users/:id', async (request) => {
    const params = request.params as { id: string };
    return prisma.user.findUnique({ where: { id: Number(params.id) }, include: { transactions: true, eventLogs: true } });
  });
  fastify.post('/admin/users/:id/adjust', async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { amount: number; adminId: number; reason: string };
    return adjustBalance(Number(params.id), body.amount, body.adminId, body.reason);
  });

  fastify.get('/admin/orders', async () => prisma.order.findMany({ include: { items: true, city: true, user: true } }));
  fastify.get('/admin/events', async () => prisma.eventLog.findMany({ orderBy: { created_at: 'desc' }, take: 100 }));
}
