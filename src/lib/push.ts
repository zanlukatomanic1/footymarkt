import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

let configured = false;

function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@footymarkt.com";
  if (!pub || !priv) return;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  configure();
  if (!configured) return { sent: 0, failed: 0, skipped: "vapid_not_configured" };
  if (userIds.length === 0) return { sent: 0, failed: 0 };

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, user_id")
    .in("user_id", userIds);

  if (!subs?.length) return { sent: 0, failed: 0 };

  const json = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const deadIds: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json
        );
        sent++;
      } catch (err: any) {
        failed++;
        // 404 / 410 = subscription is gone, prune it.
        const code = err?.statusCode;
        if (code === 404 || code === 410) deadIds.push(s.id);
      }
    })
  );

  if (deadIds.length) {
    await admin.from("push_subscriptions").delete().in("id", deadIds);
  }

  return { sent, failed };
}
