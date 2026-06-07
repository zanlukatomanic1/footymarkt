import { createAdminClient } from "@/lib/supabase/server";

/**
 * Per-user sliding-window rate limit, backed by Postgres (see
 * supabase/migrations/0019_rate_limits.sql).
 *
 * Returns true when the request is allowed (and records the event);
 * false when the user has hit the limit. On infrastructure errors
 * we fail open and return true — better than blocking real users
 * if the limiter itself misbehaves.
 */
export async function checkRateLimit(
  userId: string,
  route: string,
  windowSecs: number,
  max: number,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_user_id: userId,
    p_route: route,
    p_window_secs: windowSecs,
    p_max: max,
  });
  if (error) {
    // Fail open — log and let the request through.
    console.error("rate-limit check failed", error);
    return true;
  }
  return data === true;
}
