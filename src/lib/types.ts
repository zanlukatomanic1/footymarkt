export type Outcome = "home" | "draw" | "away";

export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  result: Outcome | null;
  competition: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
};

export type Sentiment = {
  match_id: string;
  home_count: number;
  draw_count: number;
  away_count: number;
  total_count: number;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  prediction: Outcome;
  bet_amount: number;
  coins_earned: number;
  was_correct: boolean | null;
  created_at: string;
};

export type UserRow = {
  id: string;
  username: string | null;
  coins: number;
  is_admin: boolean;
  created_at: string;
};

export type League = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};
