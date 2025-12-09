import dotenv from 'dotenv';
dotenv.config();

export const BOT_TOKEN = '8023920084:AAFR5IWY0SfyQtpqP0Ojn63eR9Xqs3gBmfc';
export const ADMIN_ID = 8360537584;
export const PUBLIC_URL = 'https://iqos-center.shop';

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/telegram_shop',
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  coingeckoUrl: process.env.COINGECKO_URL || 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=huf',
  webhookPath: '/telegram/webhook',
};
