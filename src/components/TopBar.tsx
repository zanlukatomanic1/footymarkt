import { createClient } from "@/lib/supabase/server";

type Props = {
  title: string;
  subtitle?: string;
};

export default async function TopBar({ title, subtitle }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let coins = 0;
  let username = "";
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("coins, username")
      .eq("id", user.id)
      .single();
    coins = data?.coins ?? 0;
    username = data?.username ?? "";
  }

  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-line bg-topbar px-[22px]">
      <div className="flex-1 min-w-0">
        <div
          className="text-[14px] font-semibold tracking-[-0.2px]"
          style={{ color: "var(--topbar-title)" }}
        >
          {title}
        </div>
        {subtitle && (
          <div className="mt-[1px] font-mono text-[10.5px] text-ink-faint">
            {subtitle}
          </div>
        )}
      </div>

      {user ? (
        <>
          <div
            className="flex items-center gap-[6px] rounded-[8px] border bg-page px-[12px] py-[5px]"
            style={{ borderColor: "var(--color-line-strong)" }}
          >
            {/* Coin icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" style={{ stroke: "var(--color-brand)" }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 2-2.5 2.5-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.9 2.5-2" />
              <path d="M12 7v1M12 16v1" />
            </svg>
            <span className="font-mono text-[12.5px] text-brand tabular-nums">
              {coins.toLocaleString()}
            </span>
            <span className="text-[12px] text-ink-silent">·</span>
            <span className="text-[11.5px] text-ink-dim">@{username}</span>
          </div>

          {/* Bell */}
          <div
            className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border bg-page cursor-pointer"
            style={{ borderColor: "var(--color-line-muted)" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="text-ink-dim"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div
              className="absolute right-[6px] top-[5px] h-[6px] w-[6px] rounded-full bg-brand"
              style={{ border: "1.5px solid var(--badge-ring)" }}
            />
          </div>
        </>
      ) : (
        <a
          href="/login"
          className="rounded-[8px] bg-brand px-4 py-[7px] text-[12.5px] font-semibold text-[#080808]"
        >
          Sign in
        </a>
      )}
    </div>
  );
}
