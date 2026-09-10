// Client API minimal — parle au backend FastAPI sur Hugging Face
import type { MatchSummary, MatchDetail } from "./types";

// URL de l'API : env var en priorité, fallback sécurisé sur l'URL HF lowercase.
// On retire d'éventuels slash de fin pour éviter `//` dans l'URL finale.
const RAW_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
export const BASE_URL =
  (RAW_BASE || "https://simsimsrfc2-smartsim-api.hf.space").replace(/\/+$/, "");

// Log côté serveur Next.js (visible dans le terminal `npm run dev`)
if (typeof window === "undefined") {
  console.log(`[smartsim/api] BASE_URL = ${BASE_URL || "(VIDE)"}`);
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    // Inclut l'URL complète appelée → debug instantané
    throw new Error(`API ${res.status} ${url} — ${txt.slice(0, 180)}`);
  }
  return res.json();
}

type MatchesResp = { date: string | null; source: string; count: number; matches: MatchSummary[] };
export type HistoryApiItem = {
  type: "smart-over25" | "smart-result" | "result";
  fixture_id: string;
  date: string;
  league: MatchSummary["league"];
  home_team: MatchSummary["home_team"];
  away_team: MatchSummary["away_team"];
  score: MatchSummary["score"];
  final_score: string;
  result_label: string;
  goals_label: string;
  status: "won" | "lost" | "pending" | "void";
  selection: {
    type: "over25" | "single" | "double_chance" | null;
    pick: "+2.5" | "1" | "N" | "2" | "1N" | "N2" | "12" | "";
    label: string;
    probability: number | null;
    confidence?: "faible" | "moyenne" | "forte";
  };
  result_selection?: MatchSummary["result_selection"];
};

export const api = {
  health: () => http<{ status: string }>("/api/health"),

  matchesToday: (refresh = false) =>
    http<MatchesResp>(`/api/matches/today${refresh ? "?refresh=true" : ""}`),

  matchesByDay: (day: "today" | "tomorrow") =>
    http<MatchesResp>(`/api/matches/${day}`),

  // Pioche dans Supabase (0 appel API-Football, 0 modèle ML requis).
  matchesSample: () => http<MatchesResp>("/api/matches/sample"),

  /**
   * Stratégie sans quota : essaye /today (cache du jour), sinon fallback /sample
   * (dernière date dispo dans Supabase). Aucun refresh API-Football automatique.
   */
  matchesTodayOrSample: async (): Promise<MatchesResp & { fallback?: boolean }> => {
    const today = await http<MatchesResp>("/api/matches/today");
    if (today.count > 0) return today;
    const sample = await http<MatchesResp>("/api/matches/sample");
    return { ...sample, fallback: true };
  },

  smartSelections: (minProba = 0, day: "today" | "tomorrow" = "today") =>
    http<{ date: string | null; source: string; count: number; total_matches: number; matches: MatchSummary[] }>(
      `/api/matches/smart-selections?day=${day}&min_proba=${minProba}`
    ),
  matchDetail: (id: string) => http<MatchDetail>(`/api/matches/${id}`),
  getBankroll: (userEmail: string) =>
    http<{ amount: number; currency: string; updated_at?: string; empty?: boolean }>(
      "/api/user/bankroll", { headers: { "X-User-Email": userEmail } }),
  setBankroll: (userEmail: string, amount: number, currency = "EUR") =>
    http<{ ok: boolean; amount: number; currency: string }>(
      "/api/user/bankroll",
      { method: "POST", headers: { "X-User-Email": userEmail },
        body: JSON.stringify({ amount, currency }) }),
  historyDates: () =>
    http<{ count: number; dates: string[] }>("/api/history/dates"),
  history: (type?: "smart-over25" | "smart-result" | "result") =>
    http<{ count: number; items: HistoryApiItem[]; source: string }>(
      `/api/history${type ? `?type=${type}` : ""}`
    ),
};
