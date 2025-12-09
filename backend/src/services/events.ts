import { prisma } from './prisma.js';
import { sendAdmin } from './bot.js';
import { Prisma } from '@prisma/client';

export async function logEvent(event_type: string, metadata: Prisma.JsonValue | null, userId?: number, notifyAdmin = false) {
  await prisma.eventLog.create({
    data: {
      event_type,
      user_id: userId,
      metadata_json: metadata,
    },
  });
  if (notifyAdmin) {
    await sendAdmin(`[Event:${event_type}] ${JSON.stringify(metadata)}`);
  }
}
