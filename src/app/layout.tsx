import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Syne } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});
const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: { default: "FootyMarkt", template: "%s | FootyMarkt" },
  description: "Social prediction market for WC 2026. The crowd sets the odds.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://footymarkt.com"),
  openGraph: {
    siteName: "FootyMarkt",
    type: "website",
    locale: "en_US",
    description: "Social prediction market for WC 2026. The crowd sets the odds.",
  },
  twitter: { card: "summary" },
  icons: { icon: "/logo.ico" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string | null; coins: number; is_admin: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("username, coins, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${syne.variable}`}
    >
      <body className="bg-page text-ink font-sans md:h-screen md:overflow-hidden">
        <div className="flex md:h-screen">
          {/* Desktop sidebar */}
          <Sidebar
            username={profile?.username ?? null}
            coins={profile?.coins ?? 0}
            isAdmin={profile?.is_admin ?? false}
            signedIn={!!user}
          />

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav
          signedIn={!!user}
          isAdmin={profile?.is_admin ?? false}
        />
      </body>
    </html>
  );
}
