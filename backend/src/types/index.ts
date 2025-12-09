import { PrismaClient, User } from '@prisma/client';
import TelegramBot from 'node-telegram-bot-api';

export interface AppContext {
  prisma: PrismaClient;
  bot: TelegramBot;
}

export interface AuthenticatedRequest {
  user: User;
}
