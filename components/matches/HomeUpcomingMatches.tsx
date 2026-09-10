import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Trophy,
} from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { MatchCard } from "@/components/matches/MatchCard";

type LooseRecord = Record<string, unknown>;

const TEAM_LOGO_FALLBACK: Record<string, string> = {
  Frosinone: "https://media.api-sports.io/football/teams/512.png",
  Mantova: "https://media.api-sports.io/football/teams/1693.png",
  Lens: "https://media.api-sports.io/football/teams/116.png",
  Nantes: "https://media.api-sports.io/football/teams/83.png",
  "SC Paderborn 07": "https://media.api-sports.io/football/teams/185.png",
  "Karlsruher SC": "https://media.api-sports.io/football/teams/785.png",
  Pescara: "https://media.api-sports.io/football/teams/525.png",
  Spezia: "https://media.api-sports.io/football/teams/515.png",
  "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png",
  "Eintracht Frankfurt": "https://media.api-sports.io/football/teams/169.png",
  Venezia: "https://media.api-sports.io/football/teams/517.png",
  Palermo: "https://media.api-sports.io/football/teams/522.png",
  Catanzaro: "https://media.api-sports.io/football/teams/1687.png",
  Bari: "https://media.api-sports.io/football/teams/508.png",
  Reggiana: "https://media.api-sports.io/football/teams/880.png",
  Sampdoria: "https://media.api-sports.io/football/teams/498.png",
  "Hull City": "https://media.api-sports.io/football/teams/64.png",
  Millwall: "https://media.api-sports.io/football/teams/58.png",
  "Virtus Entella": "https://media.api-sports.io/football/teams/527.png",
  Carrarese: "https://media.api-sports.io/football/teams/1581.png",
  Torino: "https://media.api-sports.io/football/teams/503.png",
  Monza: "https://media.api-sports.io/football/teams/1579.png",
  Empoli: "https://media.api-sports.io/football/teams/511.png",
  "1. FC Kaiserslautern": "https://media.api-sports.io/football/teams/745.png",
  "Arminia Bielefeld": "https://media.api-sports.io/football/teams/188.png",
  Cesena: "https://media.api-sports.io/football/teams/509.png",
  Padova: "https://media.api-sports.io/football/teams/870.png",
  Sudtirol: "https://media.api-sports.io/football/teams/1578.png",
  "Juve Stabia": "https://media.api-sports.io/football/teams/863.png",
  Osasuna: "https://media.api-sports.io/football/teams/727.png",
  "Standard Liege": "https://media.api-sports.io/football/teams/733.png",
  Villefranche: "https://media.api-sports.io/football/teams/1302.png",
  Ajaccio: "https://media.api-sports.io/football/teams/98.png",
  Avellino: "https://media.api-sports.io/football/teams/528.png",
  Modena: "https://media.api-sports.io/football/teams/899.png",
};

function formatTime(iso: string): string {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

function formatDateLabel(iso: string): string {
  if (!iso) return "Aujourd'hui";
  try {
    const date = new Date(iso);
    const today = new Date();
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      return "Aujourd'hui";
    }
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "Aujourd'hui";
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

function getStatTone(value: number): string {
  if (value >= 0.65) {
    return "border-[rgba(53,231,90,0.22)] bg-[rgba(53,231,90,0.10)] text-[#35E75A]";
  }
  if (value >= 0.5) {
    return "border-[rgba(245,197,66,0.24)] bg-[rgba(245,197,66,0.11)] text-[#F5C542]";
  }
  return "border-[rgba(255,91,91,0.22)] bg-[rgba(255,91,91,0.10)] text-[#FF6B6B]";
}

function getWinnerLabel(match: MatchSummary): string {
  // Priorité result_selection (double chance possible), sinon predicted_winner
  const rs = match.result_selection;
  if (rs?.is_result_selection && rs.pick) {
    if (rs.pick === "1") return match.home_team.name;
    if (rs.pick === "2") return match.away_team.name;
    if (rs.pick === "N") return "Match nul";
    if (rs.pick === "1N") return `${match.home_team.name} ou nul`;
    if (rs.pick === "N2") return `Nul ou ${match.away_team.name}`;
    if (rs.pick === "12") return `${match.home_team.name} ou ${match.away_team.name}`;
  }
  const pw = String(match.predicted_winner || "").toLowerCase();
  if (pw === "home" || pw === "domicile" || pw === "1") return match.home_team.name;
  if (pw === "away" || pw === "extérieur" || pw === "exterieur" || pw === "2") return match.away_team.name;
  if (pw === "draw" || pw === "nul" || pw === "n") return "Match nul";
  return "Signal";
}

function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === "object" ? (value as LooseRecord) : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNestedString(source: unknown, path: string[]): string {
  let current: unknown = source;
  for (const key of path) {
    const record = asRecord(current);
    if (!record) return "";
    current = record[key];
  }
  return readString(current);
}

function getTeamName(match: MatchSummary, side: "home" | "away"): string {
  const typedTeam = side === "home" ? match.home_team : match.away_team;
  const source = match as unknown;
  const candidates =
    side === "home"
      ? [
          typedTeam.name,
          getNestedString(source, ["homeTeam", "name"]),
          getNestedString(source, ["home", "name"]),
          getNestedString(source, ["teams", "home", "name"]),
          readString((match as unknown as LooseRecord).homeTeam),
          readString((match as unknown as LooseRecord).home_team),
        ]
      : [
          typedTeam.name,
          getNestedString(source, ["awayTeam", "name"]),
          getNestedString(source, ["away", "name"]),
          getNestedString(source, ["teams", "away", "name"]),
          readString((match as unknown as LooseRecord).awayTeam),
          readString((match as unknown as LooseRecord).away_team),
        ];

  return candidates.find(Boolean) || typedTeam.name;
}

function getTeamLogo(match: MatchSummary, side: "home" | "away"): string {
  const typedTeam = side === "home" ? match.home_team : match.away_team;
  const source = match as unknown;
  const candidates =
    side === "home"
      ? [
          typedTeam.logo,
          readString((match as unknown as LooseRecord).homeLogo),
          readString((match as unknown as LooseRecord).home_team_logo),
          readString((match as unknown as LooseRecord).teamHomeLogo),
          getNestedString(source, ["homeTeam", "logo"]),
          getNestedString(source, ["home", "logo"]),
          getNestedString(source, ["teams", "home", "logo"]),
          getNestedString(source, ["home_team", "logo"]),
        ]
      : [
          typedTeam.logo,
          readString((match as unknown as LooseRecord).awayLogo),
          readString((match as unknown as LooseRecord).away_team_logo),
          readString((match as unknown as LooseRecord).teamAwayLogo),
          getNestedString(source, ["awayTeam", "logo"]),
          getNestedString(source, ["away", "logo"]),
          getNestedString(source, ["teams", "away", "logo"]),
          getNestedString(source, ["away_team", "logo"]),
        ];

  return candidates.find(Boolean) || TEAM_LOGO_FALLBACK[getTeamName(match, side)] || "";
}

function sortByKickoff(matches: MatchSummary[]): MatchSummary[] {
  return [...matches].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
    return aTime - bTime;
  });
}

export function HomeUpcomingMatches({ matches }: { matches: MatchSummary[] }) {
  const upcoming = sortByKickoff(matches).slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[rgba(120,170,150,0.16)] bg-[rgba(7,16,24,0.78)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-[14px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(53,231,90,0.09),transparent_32%),radial-gradient(circle_at_96%_100%,rgba(73,181,255,0.08),transparent_30%)]" />

      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[rgba(53,231,90,0.25)] bg-[rgba(53,231,90,0.10)] text-[#35E75A]">
            <CalendarDays size={25} />
          </div>
          <div>
            <h2 className="text-[27px] font-extrabold leading-tight tracking-[-0.04em] text-[#F3F6F7]">
              Prochains matchs à suivre
            </h2>
            <p className="mt-1 text-sm text-[rgba(220,230,235,0.72)]">
              Les affiches les plus proches, triées du plus tôt au plus tard.
            </p>
          </div>
        </div>
        <Link
          href="/matches"
          className="group inline-flex h-11 items-center gap-2 rounded-full border border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.04)] px-4 text-sm font-bold text-[#35E75A] transition-colors hover:bg-[rgba(53,231,90,0.09)]"
        >
          Voir tous les matchs
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/*
        Uniformisation : on utilise la MatchCard premium partout (même
        composant que /smart-sim, /matches mobile, Accueil "Smart Sim du jour").
        Plus de lignes horizontales avec noms tronqués "BSC Youn..." ou
        recommandations "Away 40%" génériques — la MatchCard affiche les noms
        complets sur 2 lignes au besoin et la recommandation = nom équipe.
      */}
      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((match) => (
          <MatchCard
            key={match.fixture_id}
            match={match}
            href={`/match/${match.fixture_id}?source=matches`}
          />
        ))}
      </div>

      <div className="relative mt-5 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[rgba(200,210,215,0.45)]">
          <Clock3 size={13} />
          Heures affichées en heure locale
        </div>
        <Link
          href="/matches"
          className="group inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(53,231,90,0.24)] px-5 text-sm font-bold text-[#35E75A] transition-colors hover:bg-[rgba(53,231,90,0.08)]"
        >
          Voir tous les matchs
          <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

function UpcomingMatchRow({ match }: { match: MatchSummary }) {
  return (
    <Link
      href={`/match/${match.fixture_id}`}
      className="group relative isolate grid min-h-[92px] w-full max-w-full grid-cols-[130px_96px_minmax(0,1fr)_190px_96px_20px] items-center gap-3 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(6,14,21,0.70)] px-3.5 py-4 transition-all duration-200 hover:-translate-y-px hover:border-[rgba(53,231,90,0.22)] max-[1120px]:grid-cols-[1fr_auto] max-[1120px]:gap-4"
    >
      {/* Fond stade premium unifié — aligné avec MatchCard / MatchRow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,8,10,0.78)_0%,rgba(3,8,10,0.94)_100%),url('/stadium-night.jpg')] bg-cover bg-center bg-no-repeat" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-16 bg-[radial-gradient(ellipse_at_top,rgba(53,231,90,0.07),transparent_70%)]" />
      <LeagueCell match={match} />
      <TimeCell match={match} />
      <MatchCell match={match} />
      <StatsCell match={match} />
      <SignalCell match={match} />
      <ChevronRight size={17} className="justify-self-center text-[rgba(243,246,247,0.36)] transition-all group-hover:translate-x-0.5 group-hover:text-[rgba(243,246,247,0.70)] max-[1120px]:col-start-2 max-[1120px]:row-span-4" />
    </Link>
  );
}

function LeagueCell({ match }: { match: MatchSummary }) {
  return (
    <div className="flex min-w-0 items-center gap-3 max-[1120px]:col-span-1">
      <CountryFlag country={match.league.country} league={match.league.name} flag={match.league.flag} />
      <div className="min-w-0">
        {match.league.country && (
          <div className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#35E75A]">
            {match.league.country}
          </div>
        )}
        <div className="truncate text-[13px] font-semibold text-[rgba(243,246,247,0.62)]">
          {match.league.name || "Ligue"}
        </div>
      </div>
    </div>
  );
}

function TimeCell({ match }: { match: MatchSummary }) {
  return (
    <div className="flex w-24 flex-col items-center justify-center rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.035)] px-3 py-2.5 max-[1120px]:justify-self-end">
      <div className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-[#35E75A]">
        {formatTime(match.date)}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(200,210,215,0.48)]">
        {formatDateLabel(match.date)}
      </div>
    </div>
  );
}

function MatchCell({ match }: { match: MatchSummary }) {
  return (
    <div className="grid min-w-0 grid-cols-[155px_32px_155px] items-center justify-center gap-x-2.5 max-[1120px]:col-span-2 max-[1120px]:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)]">
      <TeamSide logo={getTeamLogo(match, "home")} name={getTeamName(match, "home")} align="right" />
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-[11px] font-extrabold uppercase tracking-[0.10em] text-[rgba(243,246,247,0.62)]">
        VS
      </div>
      <TeamSide logo={getTeamLogo(match, "away")} name={getTeamName(match, "away")} align="left" />
    </div>
  );
}

function TeamSide({ logo, name, align }: { logo: string; name: string; align: "left" | "right" }) {
  const teamName = (
    <span
      className={`min-w-0 truncate text-[15px] font-semibold leading-tight text-[#F3F6F7] ${
        align === "right" ? "text-right" : "text-left"
      }`}
      style={{ maxWidth: 110 }}
    >
      {name}
    </span>
  );

  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {align === "right" && (
        <>
          {teamName}
          <TeamLogo logo={logo} name={name} />
        </>
      )}
      {align === "left" && (
        <>
          <TeamLogo logo={logo} name={name} />
          {teamName}
        </>
      )}
    </div>
  );
}

function TeamLogo({ logo, name }: { logo: string; name: string }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="h-[30px] w-[30px] shrink-0 object-contain"
      />
    );
  }

  return (
    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] text-[10px] font-extrabold tracking-[0.04em] text-[rgba(243,246,247,0.88)]">
      {getTeamInitials(name)}
    </span>
  );
}

function StatsCell({ match }: { match: MatchSummary }) {
  return (
    <div className="flex min-w-0 max-w-[190px] items-center justify-end gap-1.5 max-[1120px]:col-span-2 max-[1120px]:justify-start">
      <StatBox label="+2.5" value={over25DisplayProbability(match)} />
      <StatBox label="+1.5" value={match.probabilities.over_15} />
      <StatBox label="BTTS" value={match.probabilities.btts} />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className={`flex h-10 w-14 flex-col items-center justify-center rounded-[10px] border text-center ${getStatTone(value)}`}
    >
      <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[rgba(220,230,235,0.62)]">
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-black leading-none">
        {Math.round(value * 100)}<span className="text-[9px] opacity-70">%</span>
      </div>
    </div>
  );
}

function SignalCell({ match }: { match: MatchSummary }) {
  // Pas de badge "Smart Sim" : on affiche systématiquement la recommandation utile.
  // Pour un match Smart Sim, la teinte gold conserve l'emphase visuelle premium.
  const isSmart = match.is_smart_bet;
  const wrapper = isSmart
    ? "inline-flex h-[40px] max-w-[130px] items-center justify-center gap-1.5 rounded-xl border border-[rgba(245,197,66,0.35)] bg-[rgba(245,197,66,0.12)] px-2.5 text-xs font-bold text-[#F5C542]"
    : "inline-flex h-[40px] max-w-[96px] items-center justify-center gap-1.5 rounded-xl border border-[rgba(120,170,150,0.14)] bg-white/[0.028] px-2.5 text-xs font-bold text-[rgba(243,246,247,0.72)]";
  const trophyClass = isSmart ? "text-[#F5C542]" : "text-[#35E75A]/80";
  const probClass = isSmart ? "text-[#F5C542]" : "text-[#35E75A]";

  return (
    <div className="flex min-w-0 items-center justify-end overflow-hidden max-[1120px]:col-span-2 max-[1120px]:justify-start">
      <span className={wrapper}>
        <Trophy size={13} className={`shrink-0 ${trophyClass}`} />
        <span className="truncate">{getWinnerLabel(match)}</span>
        <span className={`shrink-0 ${probClass}`}>{Math.round(match.winner_proba * 100)}%</span>
      </span>
    </div>
  );
}
