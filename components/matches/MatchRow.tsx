import Image from "next/image";
import Link from "next/link";
import { Clock, ChevronRight, Trophy } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";
import { StatPill } from "@/components/ui/StatPill";

function fmtTime(iso: string): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" , timeZone: "Europe/Paris"}); }
  catch { return "—"; }
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

  if (meaningful.length >= 2) {
    return `${meaningful[0][0] || ""}${meaningful[1][0] || ""}`.toUpperCase();
  }

  const word = (meaningful[0] || rawParts[0] || name).replace(/[^a-zA-Z0-9]/g, "");
  return word.slice(0, 2).toUpperCase();
}

export function MatchRow({ match: m }: { match: MatchSummary }) {
  // Priorité result_selection (double chance), sinon predicted_winner
  const rs = m.result_selection;
  let winnerLabel: string | null = null;
  let winnerProba = m.winner_proba;
  if (rs?.is_result_selection && rs.pick && rs.probability != null) {
    if (rs.pick === "1") winnerLabel = m.home_team.name;
    else if (rs.pick === "2") winnerLabel = m.away_team.name;
    else if (rs.pick === "N") winnerLabel = "Match nul";
    else if (rs.pick === "1N") winnerLabel = `${m.home_team.name} ou nul`;
    else if (rs.pick === "N2") winnerLabel = `Nul ou ${m.away_team.name}`;
    else if (rs.pick === "12") winnerLabel = `${m.home_team.name} ou ${m.away_team.name}`;
    winnerProba = rs.probability;
  } else if (m.predicted_winner) {
    const pw = String(m.predicted_winner || "").toLowerCase();
    if (pw === "home" || pw === "domicile" || pw === "1") winnerLabel = m.home_team.name;
    else if (pw === "away" || pw === "extérieur" || pw === "exterieur" || pw === "2") winnerLabel = m.away_team.name;
    else if (pw === "draw" || pw === "nul" || pw === "n") winnerLabel = "Match nul";
  }

  return (
    <Link
      href={`/match/${m.fixture_id}`}
      className="group relative isolate grid h-[92px] grid-cols-[72px_minmax(360px,1fr)_260px_118px_30px] items-center gap-[14px] overflow-hidden rounded-[22px] border border-[rgba(130,170,150,0.14)] bg-[rgba(10,18,24,0.70)] p-[12px_14px] shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-px hover:border-brand/25 max-[1280px]:grid-cols-[72px_minmax(320px,1fr)_240px_110px_30px] max-[1100px]:h-auto max-[1100px]:grid-cols-[70px_minmax(0,1fr)_32px]"
    >
      {/* Fond stade premium unifié — même langage visuel que MatchCard (Real Madrid / FC Thun) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,8,10,0.78)_0%,rgba(3,8,10,0.94)_100%),url('/stadium-night.jpg')] bg-cover bg-center bg-no-repeat" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-16 bg-[radial-gradient(ellipse_at_top,rgba(53,231,90,0.07),transparent_70%)]" />
      <TimeBadge date={m.date} />
      <div className="grid min-w-0 grid-cols-[minmax(140px,1fr)_34px_minmax(140px,1fr)] items-center gap-3 max-[1100px]:col-start-2">
        <TeamIdentity name={m.home_team.name} logo={m.home_team.logo} side="home" />
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-white/[0.025] text-[9px] font-extrabold uppercase tracking-[0.14em] text-fg/50">VS</span>
        <TeamIdentity name={m.away_team.name} logo={m.away_team.logo} side="away" />
      </div>
      <div className="flex items-center gap-2 max-[1100px]:col-start-2 max-[1100px]:row-start-2">
        <StatPill label="+2.5" value={over25DisplayProbability(m)} size="sm" />
        <StatPill label="+1.5" value={m.probabilities.over_15} size="sm" />
        <StatPill label="BTTS" value={m.probabilities.btts} size="sm" />
      </div>
      <div className="flex min-w-[118px] justify-end max-[1100px]:col-start-2 max-[1100px]:row-start-3 max-[1100px]:justify-start">
        <SignalBadge isSmart={m.is_smart_bet} winnerLabel={winnerLabel} winnerProba={winnerProba} />
      </div>
      <ChevronRight size={18} className="flex w-8 justify-center text-fg/35 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-fg/70 max-[1100px]:col-start-3 max-[1100px]:row-span-3" />
    </Link>
  );
}

function TimeBadge({ date }: { date: string }) {
  return (
    <div className="inline-flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] border border-[rgba(130,170,150,0.16)] bg-white/[0.028]">
      <Clock size={12} className="text-brand/75" />
      <span className="font-mono text-[14px] font-extrabold leading-none tracking-[0.04em] text-fg">{fmtTime(date)}</span>
    </div>
  );
}

function TeamIdentity({
  name,
  logo,
  side,
}: {
  name: string;
  logo: string;
  side: "home" | "away";
}) {
  const badge = logo ? (
    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-white/[0.035] text-[11px] font-extrabold tracking-[0.04em] text-fg">
      <Image
        src={logo}
        alt=""
        width={34}
        height={34}
        unoptimized
        className="max-h-[34px] max-w-[34px] rounded-full object-contain"
      />
    </span>
  ) : (
    <TeamPlaceholder name={name} />
  );

  return (
    <div className={`flex min-w-0 items-center gap-3 ${side === "home" ? "justify-end" : "justify-start"}`}>
      {side === "home" && (
        <>
          <span className="block max-w-[300px] whitespace-normal text-right text-lg font-extrabold leading-[1.08] tracking-[-0.035em] text-fg max-[1280px]:text-base">
            {name}
          </span>
          {badge}
        </>
      )}
      {side === "away" && (
        <>
          {badge}
          <span className="block max-w-[300px] whitespace-normal text-left text-lg font-extrabold leading-[1.08] tracking-[-0.035em] text-fg max-[1280px]:text-base">
            {name}
          </span>
        </>
      )}
    </div>
  );
}

function TeamPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-[rgba(255,255,255,0.035)] text-[10px] font-bold tracking-[0.04em] text-fg/85">
      {getTeamInitials(name)}
    </div>
  );
}

function SignalBadge({
  isSmart,
  winnerLabel,
  winnerProba,
}: {
  isSmart: boolean;
  winnerLabel: string | null;
  winnerProba: number;
}) {
  // Plus de badge "Smart Sim" : on garde uniquement la recommandation utile.
  // Pour un match Smart Sim, on conserve la teinte gold pour l'emphase visuelle.
  if (!winnerLabel) {
    return <span className="text-xs font-bold text-fg-muted">Analyse</span>;
  }

  const wrapperClass = isSmart
    ? "flex h-8 max-w-[140px] items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-[#D8AC2F]/40 bg-[rgba(216,172,47,0.14)] px-2.5 text-xs font-bold text-[#F5C542]"
    : "flex h-8 max-w-[116px] items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-[rgba(130,170,150,0.14)] bg-white/[0.028] px-2.5 text-xs font-bold text-fg/80";

  return (
    <span className={wrapperClass}>
      <Trophy size={12} className={`shrink-0 ${isSmart ? "text-[#F5C542]" : "text-brand/80"}`} />
      <span className={`truncate ${isSmart ? "text-[#F5C542]" : "text-fg"}`}>{winnerLabel}</span>
      <span className={isSmart ? "text-[#F5C542]" : "text-brand"}>{Math.round(winnerProba * 100)}%</span>
    </span>
  );
}
