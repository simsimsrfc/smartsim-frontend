import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { api, BASE_URL } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";
import { HomeHero } from "@/components/layout/HomeHero";
import { HomeUpcomingMatches } from "@/components/matches/HomeUpcomingMatches";
import { MatchCard } from "@/components/matches/MatchCard";

export const revalidate = 30;

function fmtTime(iso: string): string {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    timeZone: "Europe/Paris"});
  } catch {
    return "--:--";
  }
}

function getTeamInitials(name: string): string {
  const exceptions: Record<string, string> = {
    "SC Paderborn 07": "PB",
    "Karlsruher SC": "KS",
    "1. FC Kaiserslautern": "KL",
    "Arminia Bielefeld": "AB",
    "Borussia Dortmund": "BD",
    "Eintracht Frankfurt": "EF",
    Lens: "LE",
    Nantes: "NA",
    Pescara: "PE",
    Spezia: "SP",
  };
  if (exceptions[name]) return exceptions[name];

  const ignored = new Set(["fc", "sc", "cf", "ac", "as", "afc", "rc", "hnk", "club", "football"]);
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((part) => part && !/^\d+$/.test(part))
    .filter((part) => !ignored.has(part.toLowerCase()))
    .filter((part) => part.length > 1);

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] || name).replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
}

function tone(value: number) {
  if (value >= 0.65) return "text-brand border-brand/25 bg-brand/[0.08]";
  if (value >= 0.5) return "text-[#F5C542] border-[#F5C542]/25 bg-[#F5C542]/[0.08]";
  return "text-[#D65C5C] border-[#D65C5C]/25 bg-[#D65C5C]/[0.08]";
}

export default async function HomePage() {
  let matches: MatchSummary[] = [];
  let smart: MatchSummary[] = [];
  let error: string | null = null;

  try {
    const [data, smartData] = await Promise.all([
      api.matchesToday(),
      api.smartSelections(0, "today").catch(() => ({ matches: [] as MatchSummary[] })),
    ]);
    matches = data.matches;
    smart = smartData.matches;
  } catch (e) {
    error = (e as Error).message;
  }

  const leagueCount = new Set(matches.map((m) => m.league.name).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <HomeHero matchCount={matches.length} smartCount={smart.length} leagueCount={leagueCount} />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-danger">Connexion à l'API impossible</div>
            <div className="mt-1 break-all font-mono text-xs text-fg-secondary">{error}</div>
            <div className="mt-2 font-mono text-[11px] text-fg-muted">
              URL utilisée : <span className="text-fg-secondary">{BASE_URL || "(vide)"}</span>
            </div>
          </div>
        </div>
      )}

      {matches.length > 0 && <HomeUpcomingMatches matches={matches} />}

      {smart.length > 0 && (
        <HomeSection
          icon={<Sparkles size={22} />}
          tone="gold"
          title="Smart Sim du jour"
          subtitle="Nos meilleures prédictions générées par nos modèles."
          href="/smart-sim"
          cta="Voir tous les Smart Sim"
        >
          {/*
            Uniformisation : on utilise la MatchCard premium partout (même
            composant qu'Accueil section principale + /smart-sim + /matches).
            Le badge gold "Smart Sim" interne a été supprimé ; le halo
            visuel gold reste via `variant="gold"`.
          */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {smart.slice(0, 3).map((match) => (
              <MatchCard
                key={match.fixture_id}
                match={match}
                variant="gold"
                href={`/match/${match.fixture_id}`}
              />
            ))}
          </div>
        </HomeSection>
      )}

      {!error && matches.length === 0 && (
        <div className="rounded-[24px] border border-[rgba(130,170,150,0.16)] bg-[rgba(10,18,24,0.76)] px-6 py-14 text-center">
          <CalendarDays size={28} className="mx-auto mb-4 text-brand" />
          <h2 className="text-lg font-semibold text-fg">Aucun match disponible pour le moment</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-secondary">
            Les matchs seront affichés dès qu'ils seront chargés par l'API.
          </p>
        </div>
      )}
    </div>
  );
}

function HomeSection({
  icon,
  tone,
  title,
  subtitle,
  href,
  cta,
  count,
  children,
}: {
  icon: ReactNode;
  tone: "green" | "gold";
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  count?: number;
  children: ReactNode;
}) {
  const accent =
    tone === "gold"
      ? "text-[#F5C542] border-[#F5C542]/20 bg-[#F5C542]/[0.08]"
      : "text-brand border-brand/20 bg-brand/[0.08]";

  return (
    <section className="overflow-hidden rounded-[28px] border border-[rgba(130,170,150,0.16)] bg-[rgba(10,18,24,0.76)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${accent}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-[25px] font-extrabold leading-tight tracking-[-0.04em] text-white">
              {title}
              {typeof count === "number" && (
                <span className="ml-2 text-lg font-semibold text-fg-muted">({count})</span>
              )}
            </h2>
            <p className="mt-0.5 text-sm text-[rgba(220,230,235,0.72)]">{subtitle}</p>
          </div>
        </div>
        <Link
          href={href}
          className={`group inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${
            tone === "gold"
              ? "border-[#F5C542]/20 text-[#F5C542] hover:bg-[#F5C542]/[0.08]"
              : "border-brand/20 text-brand hover:bg-brand/[0.08]"
          }`}
        >
          {cta}
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function HomeSmartCard({ match }: { match: MatchSummary }) {
  const winnerName =
    match.predicted_winner === "home"
      ? match.home_team.name
      : match.predicted_winner === "away"
        ? match.away_team.name
        : "Nul";

  return (
    <Link
      href={`/match/${match.fixture_id}`}
      className="group relative min-h-[300px] overflow-hidden rounded-[18px] border border-[#F5C542]/35 bg-[#111821] shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-1"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,10,0.52)_0%,rgba(3,8,10,0.90)_100%),url('/stadium-night.jpg')] bg-cover bg-center" />
      <div className="relative flex h-full min-h-[300px] flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
            {match.league.flag && <span>{match.league.flag}</span>}
            <span className="truncate">{match.league.name || "Ligue"}</span>
          </div>
          <div className="text-xs text-fg-secondary">Aujourd'hui · {fmtTime(match.date)}</div>
        </div>

        <div className="grid grid-cols-[1fr_48px_1fr] items-center gap-4 py-4">
          <TeamPoster team={match.home_team} />
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/30 text-sm font-extrabold text-white">
            VS
          </span>
          <TeamPoster team={match.away_team} />
        </div>

        <div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <MiniStat label="+2.5" value={over25DisplayProbability(match)} large />
            <MiniStat label="+1.5" value={match.probabilities.over_15} large />
            <MiniStat label="BTTS" value={match.probabilities.btts} large />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-[#F5C542] px-4 text-sm font-extrabold text-[#0B0F14] shadow-[0_8px_24px_rgba(245,197,66,0.18)]">
              <Sparkles size={14} /> Smart Sim
            </span>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-brand/20 bg-brand/[0.08] px-3 text-sm font-bold text-brand">
              <Trophy size={14} /> {winnerName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TeamPoster({ team }: { team: { name: string; logo: string } }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <TeamAvatar team={team} size={58} />
      <div className="line-clamp-2 text-base font-extrabold leading-tight text-white">{team.name}</div>
    </div>
  );
}

function TeamAvatar({
  team,
  size,
}: {
  team: { name: string; logo: string };
  size: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-[rgba(130,170,150,0.16)] bg-white/[0.035] text-xs font-bold tracking-[0.04em] text-white"
      style={{ width: size, height: size }}
    >
      {team.logo ? (
        <Image
          src={team.logo}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="max-h-full max-w-full rounded-full object-contain"
        />
      ) : (
        getTeamInitials(team.name)
      )}
    </span>
  );
}

function MiniStat({
  label,
  value,
  large = false,
}: {
  label: string;
  value: number;
  large?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border text-center ${tone(value)} ${
        large ? "h-[52px]" : "h-[42px] w-[76px]"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-secondary">{label}</div>
      <div className="mt-0.5 text-base font-extrabold leading-none">
        {Math.round(value * 100)}<span className="text-[10px] opacity-70">%</span>
      </div>
    </div>
  );
}
