import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "FootyMarkt",
  description: "Social prediction market for football. Crowd-set odds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-4">
          {children}
        </main>
      </body>
    </html>
  );
}
