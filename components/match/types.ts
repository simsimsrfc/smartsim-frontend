import type { ReactNode } from "react";

export type MatchAnalysisSource = "matches" | "smart-over25" | "smart-result" | "history" | string;

export type MatchAnalysisView =
  | "recommendation-over25"
  | "recommendation-result"
  | "over25"
  | "result"
  | "over15"
  | "btts";

export type MatchAnalysisTab = {
  key: MatchAnalysisView;
  label: string;
  hrefTab?: string;
};

export type ResultPick = {
  code: "1" | "N" | "2" | "1N" | "N2" | "12";
  label: string;
  value: number;
};

export type ProbabilityItem = {
  key: MatchAnalysisView;
  label: string;
  value: number | null;
  helper: string;
};

export type AnalysisSignal = {
  title: string;
  text: string;
  icon: ReactNode;
};

export type AnalysisViewConfig = {
  title: string;
  badge?: string;
  primary: string;
  subPrimary: string;
  probability: number | null;
  available: boolean;
  shortText: string;
  whyTitle: string;
  summaryTitle: string;
  signals: AnalysisSignal[];
  summary: string;
  // Insight optionnels du backend (surface warnings et messages contextuels)
  insightHeadline?: string;
  insightWarning?: string;
};
