"use client";
import Image from "next/image";
import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";
import { useUserEmail } from "@/components/providers/UserProvider";
import { useBankroll } from "@/lib/useBankroll";
import { isAdmin } from "@/lib/admin";

function fmtTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" , timeZone: "Europe/Paris"});
  } catch { return "—"; }
}

function probTone(p: number) {
  if (p >= 0.65) return { text: "text-[#35E75A]", bg: "bg-[rgba(53,231,90,0.075)]", border: "border-[rgba(53,231,90,0.20)]" };
  if (p >= 0.5)  return { text: "text-[#D8AF3A]", bg: "bg-[rgba(216,175,58,0.075)]", border: "border-[rgba(216,175,58,0.20)]" };
  return { text: "text-[#E85B5B]", bg: "bg-[rgba(232,91,91,0.075)]", border: "border-[rgba(232,91,91,0.20)]" };
}

function getTeamInitials(name: string): string {
  const exceptions: Record<string, string> = {
    "SC Paderborn 07": "PB",
    "Karlsruher SC": "KS",
    "1. FC Kaiserslautern": "KL",
    "Borussia Dortmund": "BD",
    "Eintracht Frankfurt": "EF",
    "Arminia Bielefeld": "AB",
    Lens: "LE",
    Nantes: "NA",
  };
  if (exceptions[name]) return exceptions[name];

  const ignored = new Set(["fc", "sc", "cf", "ac", "as", "afc", "rc", "hnk", "club", "football"]);
  const rawParts = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((part) => part && !/^\d+$/.test(part) && !["07", "1"].includes(part));
  const meaningful = rawParts
    .filter((part) => part.length > 1)
    .filter((part) => !ignored.has(part.toLowerCase()));

  if (meaningful.length >= 2) return `${meaningful[0][0] || ""}${meaningful[1][0] || ""}`.toUpperCase();
  const word = (meaningful[0] || rawParts[0] || name).replace(/[^a-zA-Z0-9]/g, "");
  return word.slice(0, 2).toUpperCase();
}

export function MatchCard({
  match,
  variant = "default",
  href,
  compact = false,
}: {
  match: MatchSummary;
  variant?: "default" | "gold";
  href?: string;
  compact?: boolean;
}) {
  const { home_team, away_team, league, probabilities, is_smart_bet, predicted_winner, winner_proba } = match;
  const isGold = variant === "gold" || is_smart_bet;
  const finishedStatuses = new Set(["FT", "AET", "PEN"]);
  const isFinished = finishedStatuses.has(String(match.status?.code || "").toUpperCase());
  const hg = match.score?.home;
  const ag = match.score?.away;

  // Admin only : affiche la mise Kelly en € basée sur la bankroll
  const userEmail = useUserEmail();
  const bankroll = useBankroll(userEmail);
  const kellyPct = match.smart_bet?.kelly_pct || 0;
  const kellyEur = (isAdmin(userEmail) && bankroll?.amount && kellyPct > 0)
    ? Math.round(bankroll.amount * kellyPct * 10) / 10
    : null;

  return (
    <Link
      href={href || `/match/${match.fixture_id}`}
      className={`group relative block overflow-hidden rounded-[24px] border border-[rgba(130,170,150,0.16)] bg-[rgba(10,18,24,0.82)] shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/25 ${
        compact ? "min-h-[240px]" : "min-h-[342px]"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,10,0.70)_0%,rgba(3,8,10,0.94)_100%),url('/stadium-night.jpg')] bg-cover bg-center bg-no-repeat" />
      <div className={`absolute inset-x-0 top-0 h-32 pointer-events-none ${isGold ? "bg-[radial-gradient(ellipse_at_top,rgba(245,197,66,0.12),transparent_68%)]" : "bg-[radial-gradient(ellipse_at_top,rgba(53,231,90,0.08),transparent_68%)]"}`} />

      <div className={`relative ${compact ? "p-3.5" : "p-5"}`}>
        <div className={`flex items-center justify-between gap-2 ${compact ? "mb-4" : "mb-7"}`}>
          <span className={`flex min-w-0 items-center gap-1.5 font-extrabold uppercase tracking-[0.12em] text-[rgba(200,210,215,0.55)] ${
            compact ? "text-[9px]" : "text-[11px] tracking-[0.14em]"
          }`}>
            {league.flag && <span className={`shrink-0 ${compact ? "text-sm" : "text-base"}`}>{league.flag}</span>}
            <span className="truncate">{league.name || "—"}</span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {match.smart_bet?.is_value && (
              <span
                title={`${match.smart_bet.reason || "Smart Sim — cote sous-évaluée par le marché"}${
                  (match.smart_bet.kelly_pct || 0) > 0
                    ? ` · Mise conseillée : ${(match.smart_bet.kelly_pct! * 100).toFixed(1)}% bankroll (Kelly fractionnaire)`
                    : ""
                }`}
                className={`inline-flex items-center gap-0.5 rounded-full border border-[#7B5CFF]/50 bg-[#7B5CFF]/14 font-black uppercase tracking-[0.08em] text-[#B7A2FF] ${
                  compact ? "px-1.5 py-[2px] text-[8px]" : "px-2 py-0.5 text-[10px]"
                }`}
              >
                ★ {compact ? "SS" : "Smart Sim"}
                {kellyPct > 0 && isAdmin(userEmail) && (
                  <span className={compact ? "ml-0.5 opacity-90" : "ml-1 opacity-80"}>
                    {kellyEur != null
                      ? `${kellyEur}${bankroll?.currency === "EUR" ? "€" : bankroll?.currency === "USD" ? "$" : bankroll?.currency === "GBP" ? "£" : ` ${bankroll?.currency || ""}`}`
                      : `${(kellyPct * 100).toFixed(1)}%`}
                  </span>
                )}
              </span>
            )}
            {is_smart_bet && !match.smart_bet?.is_value && (
              <span
                className={`inline-flex items-center rounded-full border border-[#F5C542]/45 bg-[#F5C542]/12 font-black uppercase tracking-[0.08em] text-[#F5C542] ${
                  compact ? "px-1.5 py-[2px] text-[8px]" : "px-2 py-0.5 text-[10px]"
                }`}
              >
                {compact ? "SS" : "Smart Sim"}
              </span>
            )}
            <span
              className={`rounded-full border border-[rgba(130,170,150,0.16)] bg-white/[0.028] font-mono font-bold text-fg/70 ${
                compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm"
              }`}
            >
              {fmtTime(match.date)}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 ${compact ? "mb-4" : "mb-6"}`}>
          <TeamSide team={home_team} align="right" compact={compact} />
          <div className="flex flex-col items-center gap-1">
            {isFinished && hg != null && ag != null ? (
              <div className={`flex items-center justify-center rounded-full border border-white/15 bg-black/40 px-2.5 ${compact ? "h-9 min-w-[52px]" : "h-12 min-w-[64px]"}`}>
                <span className={`font-black text-[#F3F6F7] ${compact ? "text-sm" : "text-base"}`}>{hg}–{ag}</span>
              </div>
            ) : (
              <div className={`flex items-center justify-center rounded-full border border-[#D8AC2F]/25 bg-black/25 shadow-[0_8px_22px_rgba(216,172,47,0.10)] ${compact ? "h-9 w-9" : "h-12 w-12"}`}>
                <span className={`font-extrabold tracking-[0.15em] text-[#D8AC2F] ${compact ? "text-[9px]" : "text-[10px]"}`}>VS</span>
              </div>
            )}
            {isFinished && (
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[rgba(243,246,247,0.60)]">
                Terminé
              </span>
            )}
          </div>
          <TeamSide team={away_team} align="left" compact={compact} />
        </div>

        <div className={`grid grid-cols-3 gap-2 ${compact ? "mb-3" : "mb-5"}`}>
          <Stat label="+2.5" value={over25DisplayProbability(match)} compact={compact} />
          <Stat label="+1.5" value={probabilities.over_15} compact={compact} />
          <Stat label="BTTS" value={probabilities.btts} compact={compact} />
        </div>

        <div className={`flex items-center justify-between gap-2 border-t border-white/[0.06] ${compact ? "pt-2.5" : "pt-4"}`}>
          {(() => {
            // Priorité : result_selection (double chance possible) > predicted_winner
            const rs = match.result_selection;
            let label = ""; let proba: number | null = null;
            if (rs?.is_result_selection && rs.pick && rs.probability != null) {
              // Double chance : combine 2 noms d'équipes
              if (rs.pick === "1N") label = `${home_team.name} ou nul`;
              else if (rs.pick === "N2") label = `Nul ou ${away_team.name}`;
              else if (rs.pick === "12") label = `${home_team.name} ou ${away_team.name}`;
              else if (rs.pick === "1") label = home_team.name;
              else if (rs.pick === "2") label = away_team.name;
              else if (rs.pick === "N") label = "Match nul";
              proba = rs.probability;
            } else if (predicted_winner) {
              const pw = String(predicted_winner || "").toLowerCase();
              if (pw === "home" || pw === "domicile" || pw === "1") label = home_team.name;
              else if (pw === "away" || pw === "extérieur" || pw === "exterieur" || pw === "2") label = away_team.name;
              else label = "Match nul";
              proba = winner_proba || null;
            }
            if (!label) {
              return <span className="text-xs text-fg-muted">Marché serré — pas de pick net</span>;
            }
            return (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs">
                <Trophy size={12} className="shrink-0 text-[#D8AF3A]" />
                <span className="truncate font-bold text-fg">{label}</span>
                {proba != null && (
                  <span className="shrink-0 font-semibold text-fg-muted">{Math.round(proba * 100)}%</span>
                )}
              </span>
            );
          })()}
          <ChevronRight size={16} className="shrink-0 text-fg/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-fg/70" />
        </div>
      </div>
    </Link>
  );
}

function TeamSide({ team, align, compact = false }: { team: { name: string; logo: string }; align: "left" | "right"; compact?: boolean }) {
  const dim = compact ? "h-10 w-10" : "h-14 w-14";
  const imgSize = compact ? 36 : 48;
  const imgCls = compact ? "max-h-9 max-w-9" : "max-h-12 max-w-12";
  const nameCls = compact ? "text-xs font-bold" : "text-base font-extrabold";
  return (
    <div className={`flex flex-col items-center ${compact ? "gap-1.5" : "gap-2.5"} text-center`}>
      <div className={`relative flex items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-white/[0.035] ${dim}`}>
        {team.logo ? (
          <Image src={team.logo} alt={team.name} width={imgSize} height={imgSize} unoptimized
            className={`object-contain drop-shadow-[0_7px_16px_rgba(0,0,0,0.45)] ${imgCls}`} />
        ) : (
          <div className={`flex items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-[rgba(255,255,255,0.035)] tracking-[0.04em] text-fg/85 ${dim} ${compact ? "text-[10px] font-bold" : "text-sm font-bold"}`}>
            {getTeamInitials(team.name)}
          </div>
        )}
      </div>
      <span className={`text-wrap leading-tight tracking-[-0.03em] text-fg ${nameCls}`}>
        {team.name}
      </span>
    </div>
  );
}

function Stat({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
  const t = probTone(value);
  return (
    <div className={`relative rounded-[12px] border text-center ${t.bg} ${t.border} ${compact ? "py-1.5" : "py-2.5"}`}>
      <div className={`font-extrabold uppercase leading-none tracking-[0.12em] text-fg/60 ${compact ? "text-[8px]" : "text-[9px]"}`}>{label}</div>
      <div className={`mt-1 font-black ${t.text} leading-none ${compact ? "text-sm" : "text-lg"}`}>
        {Math.round(value * 100)}<span className={`font-bold opacity-60 ${compact ? "text-[10px]" : "text-xs"}`}>%</span>
      </div>
    </div>
  );
}
