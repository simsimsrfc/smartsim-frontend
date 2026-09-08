import type { MatchSummary } from "@/lib/types";

export function over25DisplayProbability(match: Pick<MatchSummary, "probabilities">): number {
  const display = match.probabilities.over_25_display;
  return typeof display === "number" && Number.isFinite(display)
    ? display
    : match.probabilities.over_25;
}

export function formatProbability(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value * 100)}%`
    : "Indispo.";
}
