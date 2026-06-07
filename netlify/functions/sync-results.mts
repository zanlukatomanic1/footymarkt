import type { Config } from "@netlify/functions";

// Netlify scheduled function — calls the Next.js API route every 15 min
// with the CRON_SECRET bearer token. requireAdminOrCron in the route
// validates the secret without touching Supabase auth.
export default async () => {
  const secret = Netlify.env.get("CRON_SECRET");
  const base = Netlify.env.get("URL") ?? Netlify.env.get("DEPLOY_PRIME_URL");
  if (!secret || !base) {
    return new Response("Missing CRON_SECRET or URL", { status: 500 });
  }
  const res = await fetch(`${base}/api/sync-results`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  return new Response(body, { status: res.status });
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
