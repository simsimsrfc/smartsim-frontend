import { CalendarDays, MapPin } from "lucide-react";
import type { MatchDetail, Team } from "@/lib/types";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { TeamLogo } from "./TeamLogo";
import { formatDate, formatTime, isUpcoming, statusLabel } from "./matchUtils";
import type { MatchAnalysisSource, MatchAnalysisView } from "./types";

export function MatchHero({
  match,
  source,
  activeTab,
}: {
  match: MatchDetail;
  source: MatchAnalysisSource;
  activeTab: MatchAnalysisView;
}) {
  const favoriteContext = getFavoriteContext(source, activeTab);

  return (
    <section className="relative isolate min-h-[190px] overflow-hidden rounded-[24px] border border-[rgba(80,255,150,0.12)] bg-[#07131c] shadow-[0_14px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <img
        src="/stadium-night.jpg"
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-55"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,12,18,0.90)_0%,rgba(5,12,18,0.70)_34%,rgba(5,12,18,0.48)_62%,rgba(5,12,18,0.72)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_75%,rgba(53,231,90,0.12),transparent_34%)]" />

      <div className="flex h-full min-h-[190px] flex-col justify-between gap-3 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-2 text-xs font-bold text-[#F3F6F7] sm:text-sm md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center gap-2 uppercase tracking-[0.08em]">
            <CountryFlag country={match.league.country} league={match.league.name} flag={match.league.flag} />
            {match.league.country && (
              <>
                <span>{match.league.country}</span>
                <span className="text-white/35">•</span>
              </>
            )}
            <span className="truncate">{match.league.name || "Ligue"}</span>
          </div>
          <div className="flex items-center gap-2 text-[rgba(243,246,247,0.82)]">
            <CalendarDays size={15} className="text-white/68 shrink-0 sm:size-[17px]" />
            <span className="truncate">{formatDate(match.date)} • {formatTime(match.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-[rgba(243,246,247,0.82)] md:justify-end">
            {match.venue && (
              <>
                <MapPin size={15} className="text-white/68 shrink-0 sm:size-[17px]" />
                <span className="truncate">{match.venue}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 md:gap-6">
          <HeroTeam team={match.home_team} align="right" />
          <div className="flex min-w-[80px] flex-col items-center gap-1 pb-1 text-center md:min-w-[100px]">
            <span className="rounded-full border border-[#35E75A]/40 bg-[#35E75A]/10 px-3 py-1 text-xs font-black text-[#35E75A] sm:px-4 sm:text-sm">
              {isUpcoming(match) ? "À venir" : statusLabel(match)}
            </span>
            <span className="text-lg font-black text-white/58 sm:text-xl">VS</span>
          </div>
          <HeroTeam team={match.away_team} align="left" />
        </div>

        {/*
          Favorite button — ligne dédiée sous les équipes en mobile (évite tout
          chevauchement avec les logos/noms). En desktop (≥md), repositionné
          en absolute bottom-right pour conserver le rendu PC d'origine.
        */}
        <div className="mt-1 flex justify-center md:hidden">
          <FavoriteButton
            match={match}
            source={favoriteContext.source}
            tab={favoriteContext.tab}
            analysisType={favoriteContext.analysisType}
            variant="hero"
          />
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-20 hidden md:block">
        <FavoriteButton
          match={match}
          source={favoriteContext.source}
          tab={favoriteContext.tab}
          analysisType={favoriteContext.analysisType}
          variant="hero"
        />
      </div>
    </section>
  );
}

function getFavoriteContext(source: MatchAnalysisSource, activeTab: MatchAnalysisView) {
  if (source === "smart-over25") {
    return { source: "smart-over25" as const, analysisType: "smart-over25" as const };
  }

  if (source === "smart-result") {
    return { source: "smart-result" as const, analysisType: "smart-result" as const };
  }

  if (activeTab === "result" || activeTab === "recommendation-result") {
    return { source: "matches" as const, tab: "result" as const, analysisType: "result" as const };
  }

  if (activeTab === "over15") {
    return { source: "matches" as const, tab: "over15" as const, analysisType: "over15" as const };
  }

  if (activeTab === "btts") {
    return { source: "matches" as const, tab: "btts" as const, analysisType: "btts" as const };
  }

  return { source: "matches" as const, tab: "over25" as const, analysisType: "over25" as const };
}

function HeroTeam({ team, align }: { team: Team; align: "left" | "right" }) {
  return (
    <div className={`relative z-10 flex flex-col items-center gap-2 ${align === "right" ? "md:items-end" : "md:items-start"}`}>
      <TeamLogo team={team} size="hero" />
      <h1 className="max-w-[260px] text-center text-lg font-black tracking-[-0.03em] text-[#F3F6F7] md:text-xl">
        {team.name}
      </h1>
    </div>
  );
}
