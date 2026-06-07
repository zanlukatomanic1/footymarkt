import type { Config } from "@netlify/functions";

// Netlify scheduled function — once a day at 06:00 UTC.
export default async () => {
  const secret = Netlify.env.get("CRON_SECRET");
  const base = Netlify.env.get("URL") ?? Netlify.env.get("DEPLOY_PRIME_URL");
  if (!secret || !base) {
    return new Response("Missing CRON_SECRET or URL", { status: 500 });
  }
  const res = await fetch(`${base}/api/sync-fixtures`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  return new Response(body, { status: res.status });
};

export const config: Config = {
  schedule: "0 6 * * *",
};
