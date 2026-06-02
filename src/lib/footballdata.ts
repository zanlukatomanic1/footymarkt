// Typed wrapper for football-data.org v4 REST API

const BASE = "https://api.football-data.org/v4";

function headers() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY is not set");
  return { "X-Auth-Token": key };
}

export type FDTeam = {
  id: number;
  name: string;
  shortName: string;
  tla: string;
};

export type FDScore = {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  fullTime: { home: number | null; away: number | null };
};

export type FDMatch = {
  id: number;
  utcDate: string;
  status:
    | "SCHEDULED"
    | "TIMED"
    | "IN_PLAY"
    | "PAUSED"
    | "FINISHED"
    | "POSTPONED"
    | "SUSPENDED"
    | "CANCELLED";
  stage: string;
  group: string | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
};

export async function fetchWCMatches(): Promise<FDMatch[]> {
  const res = await fetch(`${BASE}/competitions/WC/matches`, {
    headers: headers(),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.matches as FDMatch[];
}

export function toOutcome(winner: FDScore["winner"]): "home" | "draw" | "away" | null {
  if (winner === "HOME_TEAM") return "home";
  if (winner === "AWAY_TEAM") return "away";
  if (winner === "DRAW") return "draw";
  return null;
}
