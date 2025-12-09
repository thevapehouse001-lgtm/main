import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import { config } from '../config/index.js';
import { prisma } from '../services/prisma.js';
import { logEvent } from '../services/events.js';
import { notifyUser, sendAdmin } from '../services/bot.js';

const checkedTx = new Set<string>();

async function fetchRate() {
  const res = await axios.get(config.coingeckoUrl);
  const price = res.data?.solana?.huf;
  if (!price) throw new Error('Rate missing');
  return price as number;
}

export async function startSolanaWorker() {
  const connection = new Connection(config.solanaRpcUrl, 'confirmed');
  setInterval(async () => {
    try {
      const users = await prisma.user.findMany({});
      const rate = await fetchRate();
      for (const user of users) {
        const address = new PublicKey(user.deposit_address);
        const signatures = await connection.getSignaturesForAddress(address, { limit: 5 });
        for (const sig of signatures) {
          if (checkedTx.has(sig.signature)) continue;
          checkedTx.add(sig.signature);
          const tx = await connection.getTransaction(sig.signature, { commitment: 'confirmed' });
          if (!tx) continue;
          const preBalance = tx.meta?.preBalances?.[0] ?? 0;
          const postBalance = tx.meta?.postBalances?.[0] ?? 0;
          const change = postBalance - preBalance;
          if (change <= 0) continue;
          const solAmount = change / LAMPORTS_PER_SOL;
          await logEvent('3_new_deposit', { tx: sig.signature, solAmount }, user.id, true);
          const hufAmount = Math.floor(solAmount * rate);
          await prisma.$transaction(async (txp) => {
            await txp.user.update({ where: { id: user.id }, data: { balance_huf: { increment: hufAmount } } });
            await txp.transaction.create({
              data: {
                user_id: user.id,
                type: 'deposit',
                amount_huf: hufAmount,
                raw_crypto_amount: solAmount.toString(),
                crypto_symbol: 'SOL',
                tx_hash: sig.signature,
                metadata_json: { rate },
              },
            });
          });
          await logEvent('4_deposit_converted', { hufAmount, solAmount }, user.id, true);
          await notifyUser(user.id, `Deposit received. ${hufAmount} HUF added.`);
        }
      }
    } catch (err: any) {
      await logEvent('8_solana_error', { message: err.message }, undefined, true);
    }
  }, 60000);
}
