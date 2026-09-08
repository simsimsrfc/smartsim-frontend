"use client";

import { Star } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { type FavoriteAnalysisType, type FavoriteSource, useFavorites } from "@/lib/favorites";

type FavoriteButtonProps = {
  match: MatchSummary;
  source: FavoriteSource;
  tab?: "recommendations" | "over25" | "result" | "over15" | "btts";
  analysisType: FavoriteAnalysisType;
  variant?: "hero" | "card";
};

export function FavoriteButton({
  match,
  source,
  tab,
  analysisType,
  variant = "card",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(match.fixture_id, analysisType);
  const isHero = variant === "hero";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite({ match, source, tab: tab || (source === "matches" ? "over25" : "recommendations"), analysisType });
      }}
      className={
        isHero
          ? `inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-black uppercase tracking-[0.08em] transition-all ${
              active
                ? "border-[rgba(53,231,90,0.34)] bg-[rgba(53,231,90,0.16)] text-[#35E75A]"
                : "border-white/[0.10] bg-[rgba(4,11,17,0.58)] text-[rgba(243,246,247,0.78)] hover:border-[rgba(53,231,90,0.24)] hover:text-[#35E75A]"
            }`
          : `flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
              active
                ? "border-[rgba(53,231,90,0.28)] bg-[rgba(53,231,90,0.14)] text-[#35E75A]"
                : "border-white/[0.10] bg-white/[0.035] text-[rgba(243,246,247,0.62)] hover:border-[rgba(53,231,90,0.24)] hover:text-[#35E75A]"
            }`
      }
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star size={isHero ? 15 : 17} className={active ? "fill-[#35E75A]" : ""} />
      {isHero && <span>{active ? "Favori" : "Ajouter aux favoris"}</span>}
    </button>
  );
}
