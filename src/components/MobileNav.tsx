"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { signedIn: boolean; isAdmin: boolean };

const TABS = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 2l9 7.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "leaderboard",
    label: "Leaders",
    href: "/leaderboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M6 3h12v7a6 6 0 0 1-12 0V3z" />
        <path d="M6 5H3a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3" />
        <path d="M18 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3" />
      </svg>
    ),
  },
  {
    id: "leagues",
    label: "Leagues",
    href: "/leagues",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "spin",
    label: "Spin",
    href: "/spin",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    id: "account",
    label: "Profile",
    href: "/account",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function MobileNav({ signedIn, isAdmin }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-line bg-sidebar md:hidden">
      {TABS.map((tab) => {
        const on = isActive(tab.href);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] transition-colors"
            style={{ color: on ? "#00ff87" : "#4a4a4a" }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
