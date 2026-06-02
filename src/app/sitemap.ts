import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footymarkt.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("id, kickoff_at")
    .order("kickoff_at", { ascending: true });

  const matchUrls: MetadataRoute.Sitemap = (matches ?? []).map((m) => ({
    url: `${BASE}/match/${m.id}`,
    lastModified: m.kickoff_at,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.7 },
    ...matchUrls,
  ];
}
