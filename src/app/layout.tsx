import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Syne, Oswald } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/lib/cache";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import ThemeProvider from "@/components/ThemeProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PushPrompt from "@/components/PushPrompt";

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
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-oswald",
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
  icons: {
    icon: "/logo.ico",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FootyMarkt",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#070707",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  let profile: { username: string | null; coins: number; is_admin: boolean } | null = null;
  let spinAvailable = false;
  if (user) {
    const supabase = createClient();
    const todayUTC = new Date().toISOString().slice(0, 10);
    const [profileData, spinRes] = await Promise.all([
      getCurrentProfile(),
      supabase
        .from("daily_spins")
        .select("id")
        .gte("spun_at", `${todayUTC}T00:00:00.000Z`)
        .limit(1)
        .maybeSingle(),
    ]);
    profile = profileData;
    spinAvailable = !spinRes.data;
  }

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${syne.variable} ${oswald.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-page text-ink font-sans md:h-screen md:overflow-hidden">
      {/* Runs synchronously before paint to prevent flash of wrong theme */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);})()`,
        }}
      />
      <ServiceWorkerRegister />
      <ThemeProvider>
        <div className="flex md:h-screen">
          {/* Desktop sidebar */}
          <Sidebar
            username={profile?.username ?? null}
            coins={profile?.coins ?? 0}
            isAdmin={profile?.is_admin ?? false}
            signedIn={!!user}
            spinAvailable={spinAvailable}
          />

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </div>

        <PushPrompt signedIn={!!user} />

        {/* Mobile bottom nav */}
        <MobileNav
          signedIn={!!user}
          isAdmin={profile?.is_admin ?? false}
          spinAvailable={spinAvailable}
        />
      </ThemeProvider>
      </body>
    </html>
  );
}
