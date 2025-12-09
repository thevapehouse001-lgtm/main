import TelegramBot from 'node-telegram-bot-api';
import { BOT_TOKEN, ADMIN_ID, PUBLIC_URL, config } from '../config/index.js';
import { prisma } from './prisma.js';
import { logEvent } from './events.js';
import { createOrGetUserWithWallet } from './users.js';

export const bot = new TelegramBot(BOT_TOKEN, { polling: false });

export async function setupWebhook(serverUrl: string) {
  const url = `${serverUrl}${config.webhookPath}`;
  await bot.setWebHook(url);
}

export function registerBotHandlers() {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from?.id?.toString();
    if (!tgId) return;
    const user = await createOrGetUserWithWallet({
      telegram_id: tgId,
      username: msg.from?.username,
      first_name: msg.from?.first_name,
      last_name: msg.from?.last_name,
    });
    const text = `Welcome to the shop!\nBalance: ${user.balance_huf} HUF\nDeposit address (Solana): ${user.deposit_address}`;
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Open shop',
              web_app: { url: PUBLIC_URL },
            },
          ],
        ],
      },
    } as const;
    await bot.sendMessage(chatId, text, keyboard);
  });

  bot.onText(/\/admin/, async (msg) => {
    if (msg.from?.id !== ADMIN_ID) return;
    const users = await prisma.user.count();
    const orders = await prisma.order.count();
    const pending = await prisma.order.count({ where: { status: 'pending' } });
    await bot.sendMessage(msg.chat.id, `Users: ${users}\nOrders: ${orders}\nPending: ${pending}`);
  });
}

export async function sendAdmin(message: string) {
  await bot.sendMessage(ADMIN_ID, message);
}

export async function notifyUser(userId: number, message: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await bot.sendMessage(Number(user.telegram_id), message).catch(() => null);
}
