import Image from "next/image";
import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";

function fmtTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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
}: {
  match: MatchSummary;
  variant?: "default" | "gold";
  href?: string;
}) {
  const { home_team, away_team, league, probabilities, is_smart_bet, predicted_winner, winner_proba } = match;
  const isGold = variant === "gold" || is_smart_bet;

  return (
    <Link
      href={href || `/match/${match.fixture_id}`}
      className="group relative block min-h-[342px] overflow-hidden rounded-[28px] border border-[rgba(130,170,150,0.16)] bg-[rgba(10,18,24,0.82)] shadow-[0_24px_70px_rgba(0,0,0,0.30)] transition-all duration-200 hover:-translate-y-1 hover:border-brand/25"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,10,0.70)_0%,rgba(3,8,10,0.94)_100%),url('/stadium-night.jpg')] bg-cover bg-center bg-no-repeat" />
      <div className={`absolute inset-x-0 top-0 h-32 pointer-events-none ${isGold ? "bg-[radial-gradient(ellipse_at_top,rgba(245,197,66,0.12),transparent_68%)]" : "bg-[radial-gradient(ellipse_at_top,rgba(53,231,90,0.08),transparent_68%)]"}`} />

      <div className="relative p-5">
        <div className="mb-7 flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[rgba(200,210,215,0.55)]">
            {league.flag && <span className="text-base shrink-0">{league.flag}</span>}
            <span className="whitespace-normal">{league.name || "—"}</span>
          </span>
          <span className="shrink-0 rounded-full border border-[rgba(130,170,150,0.16)] bg-white/[0.028] px-3 py-1 font-mono text-sm font-bold text-fg/70">
            {fmtTime(match.date)}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamSide team={home_team} align="right" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D8AC2F]/25 bg-black/25 shadow-[0_8px_22px_rgba(216,172,47,0.10)]">
              <span className="text-[10px] font-extrabold tracking-[0.15em] text-[#D8AC2F]">VS</span>
            </div>
          </div>
          <TeamSide team={away_team} align="left" />
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <Stat label="+2.5" value={over25DisplayProbability(match)} />
          <Stat label="+1.5" value={probabilities.over_15} />
          <Stat label="BTTS" value={probabilities.btts} />
        </div>

        {/*
          Footer recommandation — utile uniquement (pas de badge "Smart Sim").
          Pour résultat : nom de l'équipe gagnante / "Match nul".
        */}
        <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
          {predicted_winner ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs">
              <Trophy size={12} className="shrink-0 text-[#D8AF3A]" />
              <span className="truncate font-bold text-fg">
                {(() => {
                  const pw = String(predicted_winner || "").toLowerCase();
                  if (pw === "home" || pw === "domicile" || pw === "1") return home_team.name;
                  if (pw === "away" || pw === "extérieur" || pw === "exterieur" || pw === "2") return away_team.name;
                  return "Match nul";
                })()}
              </span>
              <span className="shrink-0 font-semibold text-fg-muted">{Math.round(winner_proba * 100)}%</span>
            </span>
          ) : (
            <span className="text-xs text-fg-muted">—</span>
          )}
          <ChevronRight size={16} className="shrink-0 text-fg/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-fg/70" />
        </div>
      </div>
    </Link>
  );
}

function TeamSide({ team, align }: { team: { name: string; logo: string }; align: "left" | "right" }) {
  return (
    <div className={`flex flex-col items-center gap-2.5 text-center ${align === "right" ? "" : ""}`}>
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-white/[0.035]">
        {team.logo ? (
          <Image
            src={team.logo}
            alt={team.name}
            width={48}
            height={48}
            unoptimized
            className="max-h-12 max-w-12 object-contain drop-shadow-[0_7px_16px_rgba(0,0,0,0.45)]"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-[rgba(255,255,255,0.035)] text-sm font-bold tracking-[0.04em] text-fg/85">
            {getTeamInitials(team.name)}
          </div>
        )}
      </div>
      <span className="text-wrap text-base font-extrabold leading-tight tracking-[-0.03em] text-fg">
        {team.name}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const t = probTone(value);
  return (
    <div className={`relative rounded-[15px] border py-2.5 text-center ${t.bg} ${t.border}`}>
      <div className="text-[9px] font-extrabold uppercase leading-none tracking-[0.12em] text-fg/60">{label}</div>
      <div className={`mt-1 text-lg font-black ${t.text} leading-none`}>
        {Math.round(value * 100)}<span className="text-xs font-bold opacity-60">%</span>
      </div>
    </div>
  );
}
