import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { env } from "@/lib/env";

let configured = false;

function resolvePublicKey() {
  return env.WEB_PUSH_PUBLIC_KEY || env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";
}

function configureIfNeeded() {
  if (configured) {
    return true;
  }

  const publicKey = resolvePublicKey();
  if (!publicKey || !env.WEB_PUSH_PRIVATE_KEY || !env.WEB_PUSH_SUBJECT) {
    return false;
  }

  webpush.setVapidDetails(
    env.WEB_PUSH_SUBJECT,
    publicKey,
    env.WEB_PUSH_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export function isWebPushConfigured() {
  return configureIfNeeded();
}

export function getWebPushPublicKey() {
  return resolvePublicKey();
}

export async function sendPushToUser(userId, payload) {
  if (!userId || !configureIfNeeded()) {
    return { sent: 0, failed: 0, disabled: 0, skipped: true };
  }

  const db = getDb();
  const subscriptions = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(
      and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.isActive, true)
      )
    );

  if (!subscriptions.length) {
    return { sent: 0, failed: 0, disabled: 0, skipped: false };
  }

  let sent = 0;
  let failed = 0;
  let disabled = 0;

  await Promise.all(
    subscriptions.map(async (item) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: item.endpoint,
            keys: {
              p256dh: item.p256dh,
              auth: item.auth,
            },
          },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = Number(error?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          await db
            .update(schema.pushSubscriptions)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(schema.pushSubscriptions.id, item.id));
          disabled += 1;
        }
      }
    })
  );

  return { sent, failed, disabled, skipped: false };
}
