import { FastifyInstance } from 'fastify';
import { prisma } from '../services/prisma.js';

export default async function cityRoutes(fastify: FastifyInstance) {
  fastify.get('/cities', async () => {
    return prisma.city.findMany({ where: { is_active: true } });
  });

  fastify.get('/cities/:id/products', async (request) => {
    const params = request.params as { id: string };
    return prisma.product.findMany({ where: { city_id: Number(params.id), is_active: true } });
  });
}
