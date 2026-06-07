import { createClient } from "@/lib/supabase/server";

function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/**
 * Authorize a request as either:
 *   - a signed-in admin user, OR
 *   - a Vercel cron invocation carrying `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Returns `null` on success, or a NextResponse with the right error status.
 */
export async function requireAdminOrCron(
  req: Request,
): Promise<{ ok: true; via: "admin" | "cron" } | { ok: false; status: number; error: string }> {
  // Cron path — match the Bearer secret first, no DB hit needed.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return { ok: true, via: "cron" };
  }

  // Admin user path.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin && !isAdminEmail(user.email)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, via: "admin" };
}
