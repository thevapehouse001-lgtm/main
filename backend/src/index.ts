import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import { config, PUBLIC_URL } from './config/index.js';
import authRoutes from './routes/auth.js';
import cityRoutes from './routes/cities.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import { bot, registerBotHandlers, setupWebhook } from './services/bot.js';
import { startSolanaWorker } from './workers/solana.js';
import { logEvent } from './services/events.js';

const server = Fastify({ logger: true });

server.register(cors, { origin: true });
server.register(formbody);
server.register(rateLimit, { max: 100, timeWindow: '1 minute' });

server.setErrorHandler(async (error, request, reply) => {
  await logEvent('10_critical_error', { message: error.message, path: request.url }, undefined, true);
  reply.status(500).send({ error: 'Internal error' });
});

server.register(async (instance) => {
  await authRoutes(instance);
  await cityRoutes(instance);
  await orderRoutes(instance);
  await adminRoutes(instance);
});

server.post(config.webhookPath, (req, res) => {
  bot.processUpdate(req.body as any);
  res.send({ ok: true });
});

async function bootstrap() {
  registerBotHandlers();
  await setupWebhook(PUBLIC_URL);
  await startSolanaWorker();
  await server.listen({ port: config.port, host: '0.0.0.0' });
  server.log.info('Server started');
}

bootstrap().catch(async (err) => {
  server.log.error(err);
  await logEvent('10_critical_error', { message: err.message }, undefined, true);
  process.exit(1);
});
