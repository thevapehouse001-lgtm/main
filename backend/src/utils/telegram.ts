import crypto from 'crypto';
import { BOT_TOKEN } from '../config/index.js';

export function verifyTelegramInitData(initData: string): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return false;
  urlParams.delete('hash');
  const dataCheckArr = Array.from(urlParams.keys())
    .sort()
    .map((key) => `${key}=${urlParams.get(key)}`);
  const dataCheckString = dataCheckArr.join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return hmac === hash;
}

export function parseTelegramUser(initData: string) {
  const urlParams = new URLSearchParams(initData);
  const userString = urlParams.get('user');
  if (!userString) return null;
  try {
    return JSON.parse(userString);
  } catch (e) {
    return null;
  }
}
