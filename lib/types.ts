// Types alignés sur le backend FastAPI (api/serializers.py)
export type Team = { id: number | null; name: string; logo: string };
export type League = { id: number | null; name: string; flag: string; country: string };

export type MatchSummary = {
  fixture_id: string;
  league: League;
  date: string;
  venue: string;
  status: { code: string; elapsed: number | null };
  score: { home: number | null; away: number | null };
  home_team: Team;
  away_team: Team;
  probabilities: {
    over_25: number;
    over_25_raw?: number | null;
    over_25_display?: number | null;
    over_25_confidence_label?: string;
    over_15: number;
    over_15_legacy?: number | null;       // valeur historique (Poisson)
    over_15_candidate?: number | null;    // proba modèle candidate (peut être null)
    over_15_source?: "candidate" | "legacy"; // origine de over_15 affiché
    btts: number;
    home_win: number;
    draw: number;
    away_win: number;
  };
  predicted_winner: string;
  winner_proba: number;
  result_selection?: {
    type: "single" | "double_chance" | null;
    pick: "1" | "N" | "2" | "1N" | "N2" | "12" | "";
    label: string;
    probability: number | null;
    confidence: "faible" | "moyenne" | "forte";
    is_result_selection: boolean;
  };
  l2m_selection?: {
    is_selection: boolean;
    pick: "L2M" | "";
    probability: number | null;
    confidence: "faible" | "moyenne" | "forte";
    label: string;
    reason: string;
  };
  is_smart_bet: boolean;
  smart_bet?: {
    is_smart_bet?: boolean;
    is_value?: boolean;
    reason?: string;
    kelly_pct?: number;
    kelly_market?: string;
  } | null;
  label: string;
  odds: { over_25: number | null; over_15: number | null; btts: number | null };
};

// Phase 2 — Insights enrichis par marché (optional, fallback-safe côté backend)
export type ConfidenceTier = "absent" | "prudent" | "moyen" | "fort";

export type MarketInsight = {
  probability: number | null;
  confidence_tier: ConfidenceTier;
  headline: string;
  warning?: string | null;
  explanations: string[];
  value?: { implied_prob: number; model_prob: number; edge: number; has_value: boolean } | null;
  market_strength_score: number;
  source?: "candidate" | "legacy";
};

export type WinnerInsight = {
  pick: "home" | "draw" | "away" | null;
  pick_label: string | null;
  probabilities: { home: number | null; draw: number | null; away: number | null };
  confidence_tier: ConfidenceTier;
  match_type: "favori_clair" | "favori_leger" | "match_ouvert" | "risque_nul" | "balanced" | null;
  headline: string;
  warning?: string | null;
  explanations: string[];
  market_strength_score: number;
};

export type MatchInsights = {
  summary: {
    best_market: "over_15" | "over_25" | "btts" | "winner" | null;
    risk_level: "faible" | "moyen" | "élevé";
    match_profile: string;
    smart_summary: string;
  };
  over25: MarketInsight;
  over15: MarketInsight;
  btts: MarketInsight;
  l2m: { is_strong_pick: boolean; probability: number | null; headline: string };
  result: WinnerInsight;
};

// Phase 3 — Lecture contextuelle humanisée (fallback-safe)
export type ContextFlag = {
  active: boolean;
  evidence: string;
  confidence: number;
};

export type MatchContext = {
  flags: Record<string, ContextFlag>;
  score: {
    score: number;
    risk_level: "LOW" | "MED" | "HIGH" | string;
    data_completeness: number;
    active_count: number;
  };
  narrative_lines: string[];
};

export type MatchDetail = MatchSummary & {
  form: { home: string[]; away: string[] };
  h2h: Array<{
    date: string;
    home: Team;
    away: Team;
    score: { home: number; away: number };
    winner_id: number | null;
  }>;
  analysis: { commentary: string; model: { xgb: number; lgb: number } };
  insights?: MatchInsights | null;   // Phase 2, fallback-safe
  context?: MatchContext | null;     // Phase 3, fallback-safe
};
