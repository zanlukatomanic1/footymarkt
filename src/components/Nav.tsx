import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string | null; coins: number } | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("username, coins")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-bg font-bold">
            F
          </span>
          <span className="text-sm font-semibold tracking-tight">FootyMarkt</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-ink-muted">
          <Link href="/leaderboard" className="hover:text-ink">
            Leaders
          </Link>
          <Link href="/leagues" className="hover:text-ink">
            Leagues
          </Link>
          {profile ? (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-ink"
            >
              <span className="text-brand">●</span>
              <span className="tabular-nums">{profile.coins}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand px-3 py-1 text-bg font-medium"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
