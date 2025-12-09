import { FastifyInstance } from 'fastify';
import { verifyTelegramInitData, parseTelegramUser } from '../utils/telegram.js';
import { createOrGetUserWithWallet } from '../services/users.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/verify', async (request, reply) => {
    const body = request.body as { initData: string };
    if (!body?.initData || !verifyTelegramInitData(body.initData)) {
      return reply.code(401).send({ error: 'Invalid init data' });
    }
    const tgUser = parseTelegramUser(body.initData);
    if (!tgUser) return reply.code(400).send({ error: 'Missing user' });
    const user = await createOrGetUserWithWallet({
      telegram_id: tgUser.id.toString(),
      username: tgUser.username,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
    });
    return { user };
  });
}
