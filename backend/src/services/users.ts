import { Keypair } from '@solana/web3.js';
import { prisma } from './prisma.js';
import { logEvent } from './events.js';
import { sendAdmin } from './bot.js';

interface TelegramProfile {
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export async function createOrGetUserWithWallet(profile: TelegramProfile) {
  let user = await prisma.user.findUnique({ where: { telegram_id: profile.telegram_id } });
  if (!user) {
    const wallet = Keypair.generate();
    const deposit_address = wallet.publicKey.toBase58();
    const deposit_secret = Buffer.from(wallet.secretKey).toString('base64'); // TODO: secure better
    user = await prisma.user.create({
      data: {
        telegram_id: profile.telegram_id,
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        deposit_address,
        deposit_secret,
        is_admin: profile.telegram_id === '8360537584',
      },
    });
    await logEvent('1_new_user', { telegram_id: profile.telegram_id }, user.id, true);
    await logEvent('2_new_wallet', { deposit_address }, user.id, true);
  }
  return user;
}

export async function adjustBalance(userId: number, amount: number, adminId: number, reason: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { balance_huf: { increment: amount } },
  });
  await prisma.transaction.create({
    data: {
      user_id: userId,
      type: 'manual_adjustment',
      amount_huf: amount,
      metadata_json: { reason, adminId },
    },
  });
  await logEvent('7_manual_adjustment', { amount, reason, adminId }, userId, true);
  return user;
}
