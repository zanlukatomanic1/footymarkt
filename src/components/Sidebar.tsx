"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DailySpinWidget from "@/components/DailySpinWidget";
import CopyEmail from "@/components/CopyEmail";

const NAV = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 2l9 7.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    href: "/leaderboard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M6 3h12v7a6 6 0 0 1-12 0V3z" />
        <path d="M6 5H3a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3" />
        <path d="M18 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3" />
      </svg>
    ),
  },
  {
    id: "leagues",
    label: "My Leagues",
    href: "/leagues",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "account",
    label: "Profile",
    href: "/account",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const ADMIN_NAV = {
  id: "admin",
  label: "Admin",
  href: "/admin",
  icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
};

type Props = {
  username: string | null;
  coins: number;
  isAdmin: boolean;
  signedIn: boolean;
  spinAvailable: boolean;
};

export default function Sidebar({ username, coins, isAdmin, signedIn, spinAvailable }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initial = (username ?? "?")[0].toUpperCase();

  return (
    <aside
      className="hidden md:flex w-[220px] min-w-[220px] flex-col border-r border-line bg-sidebar"
      style={{ height: "100vh" }}
    >
      {/* Logo */}
      <div className="px-[14px] py-[14px]">
        <img src="/logo.png" alt="FootyMarkt" className="h-20 w-[200px] object-contain object-left" />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-[1px] px-[10px]">
        {navItems.map((item) => {
          const on = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-[9px] rounded-[8px] px-[11px] py-[9px] text-[13.5px] transition-colors"
              style={{
                background: on ? "rgba(0,255,135,0.07)" : "transparent",
                color: on ? "#00ff87" : "#4a4a4a",
                fontWeight: on ? 600 : 400,
              }}
            >
              <span className="flex items-center flex-shrink-0" style={{ opacity: on ? 1 : 0.8 }}>
                {item.icon}
              </span>
              {item.label}
              {on && (
                <div className="ml-auto h-[5px] w-[5px] rounded-full bg-brand flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Daily Spin widget */}
      <DailySpinWidget spinAvailable={spinAvailable} signedIn={signedIn} />

      {/* Bottom section */}
      <div className="border-t border-[#181818] px-[10px] pt-[10px] pb-[14px] mt-2">
        <div className="flex items-center gap-[9px] rounded-[8px] px-[11px] py-[7px] text-[13px] text-[#333] cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </div>
        <CopyEmail className="px-[11px] py-[5px]" />

        {/* User row */}
        {signedIn ? (
          <div className="flex items-center gap-[9px] rounded-[8px] px-[11px] py-[10px] mt-1">
            <div
              className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-[#fff]"
              style={{ background: "linear-gradient(135deg, #00ff87, #4d7cff)" }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-[#aaa] truncate">
                {username ?? "—"}
              </div>
              <button
                onClick={signOut}
                className="font-mono text-[10.5px] text-[#333] hover:text-ink-muted transition-colors"
              >
                {coins.toLocaleString()} coins
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="mt-1 flex w-full items-center justify-center rounded-[8px] bg-brand py-[9px] text-[13px] font-semibold text-[#080808]"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
