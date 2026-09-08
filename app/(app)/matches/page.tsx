import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { MatchCard } from "@/components/matches/MatchCard";

export const revalidate = 30;
export const metadata = { title: "Tous les matchs — Smart Sim" };

type ResultSim = {
  code: "1" | "N" | "2";
  label: string;
  confidence: number;
};

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

const COUNTRY_BY_LEAGUE: Record<string, string> = {
  "ligue 1": "France",
  "ligue 2": "France",
  "serie a": "Italie",
  "serie b": "Italie",
  bundesliga: "Allemagne",
  "2. bundesliga": "Allemagne",
  laliga: "Espagne",
  "la liga": "Espagne",
  "premier league": "Angleterre",
  championship: "Angleterre",
  eredivisie: "Pays-Bas",
  "liga portugal": "Portugal",
  "primeira liga": "Portugal",
  "süper lig": "Turquie",
  "super lig": "Turquie",
  hnl: "Croatie",
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

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function inferCountry(match: MatchSummary): string {
  if (match.league.country) return match.league.country;
  return COUNTRY_BY_LEAGUE[normalize(match.league.name || "")] || "";
}

function getTeamInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !["fc", "sc", "cf", "ac", "as", "afc", "rc", "club", "football"].includes(part.toLowerCase()))
    .filter((part) => !/^\d+$/.test(part));

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] || name).replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
}

function teamLogo(match: MatchSummary, side: "home" | "away"): string {
  const team = side === "home" ? match.home_team : match.away_team;
  return team.logo || TEAM_LOGO_FALLBACK[team.name] || "";
}

function resultSim(match: MatchSummary): ResultSim {
  const options: ResultSim[] = [
    { code: "1", label: "Victoire domicile", confidence: match.probabilities.home_win },
    { code: "N", label: "Match nul", confidence: match.probabilities.draw },
    { code: "2", label: "Victoire extérieur", confidence: match.probabilities.away_win },
  ];
  return options.sort((a, b) => b.confidence - a.confidence)[0];
}

export default async function MatchesPage({ searchParams }: { searchParams?: { page?: string } }) {
  let matches: MatchSummary[] = [];
  let error: string | null = null;

  try {
    const data = await api.matchesToday();
    matches = data.matches;
  } catch (e) {
    error = (e as Error).message;
  }

  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(matches.length / perPage));
  const currentPage = Math.min(Math.max(Number(searchParams?.page || 1) || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const visibleMatches = matches.slice(startIndex, startIndex + perPage);

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
      <MatchesHero />

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 font-mono text-sm text-danger">
          {error}
        </div>
      )}

      {!error && (
        <>
          <MatchesFilters />
          <MatchesTable matches={visibleMatches} total={matches.length} totalPages={totalPages} currentPage={currentPage} perPage={perPage} />
        </>
      )}
    </div>
  );
}

function MatchesHero() {
  return (
    <header className="relative isolate min-h-[330px] overflow-hidden rounded-[32px] border border-[rgba(53,231,90,0.14)] bg-[#07131c] px-10 py-9 shadow-[0_14px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <img
        src="/stadium-night.jpg"
        alt=""
        className="absolute inset-0 -z-30 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,12,18,0.88)_0%,rgba(5,12,18,0.68)_36%,rgba(5,12,18,0.38)_62%,rgba(5,12,18,0.24)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_78%,rgba(52,231,90,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(73,181,255,0.10),transparent_26%)]" />

      <div className="relative max-w-[720px]">
        <span className="mb-5 inline-flex h-[34px] w-fit items-center rounded-full border border-[rgba(53,231,90,0.28)] bg-[rgba(5,11,18,0.36)] px-4 text-xs font-extrabold uppercase tracking-[0.22em] text-brand">
          Tous les matchs
        </span>
        <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.06em] text-white md:text-6xl lg:text-[64px]">
          Tous les matchs
        </h1>
        <p className="mt-5 max-w-[680px] text-lg leading-[1.55] text-[rgba(220,230,235,0.72)] md:text-[20px]">
          Découvrez et analysez l'ensemble des matchs disponibles avec nos modèles statistiques avancés.
        </p>
        <Link
          href="/smart-sim"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-[14px] bg-[#F5C542] px-5 text-sm font-extrabold text-[#0B0F14] shadow-[0_8px_24px_rgba(245,197,66,0.22)] transition-colors hover:bg-[#FFD45A]"
        >
          <Sparkles size={14} strokeWidth={2.5} />
          Voir Smart Sim
          <ChevronRight size={16} />
        </Link>
      </div>
    </header>
  );
}

function MatchesFilters() {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FilterBox label="Date" value="Aujourd'hui" />
        <FilterBox label="Championnats" value="Tous" />
        <FilterBox label="Résultats" value="Tous" />
        <FilterBox label="+2,5 buts" value="Tous" />
      </div>
      <div className="flex h-[52px] w-full max-w-[360px] min-w-[260px] items-center gap-3 rounded-[14px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-4 text-sm text-[rgba(243,246,247,0.44)]">
        <Search size={18} className="shrink-0 text-[rgba(243,246,247,0.48)]" />
        <span className="truncate">Rechercher un match, une équipe...</span>
      </div>
    </section>
  );
}

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[52px] min-w-[150px] items-center justify-between gap-4 rounded-[14px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-4">
      <div>
        <div className="text-[11px] font-medium text-[rgba(243,246,247,0.42)]">{label}</div>
        <div className="mt-0.5 text-sm font-bold text-[#F3F6F7]">{value}</div>
      </div>
      <ChevronDown size={15} className="text-[rgba(243,246,247,0.58)]" />
    </div>
  );
}

function MatchesTable({
  matches,
  total,
  totalPages,
  currentPage,
  perPage,
}: {
  matches: MatchSummary[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}) {
  return (
    <>
      {/*
        Mobile (< lg) : grille de cartes premium MatchCard, une carte par match.
        Toute la carte est cliquable vers /match/[fixture_id]. Plus de tableau
        compressé qui cachait la deuxième équipe sur 390px.
      */}
      <section className="space-y-3 lg:hidden">
        {matches.length > 0 ? (
          matches.map((match) => (
            <MatchCard
              key={match.fixture_id}
              match={match}
              href={`/match/${match.fixture_id}?source=matches`}
            />
          ))
        ) : (
          <div className="rounded-[20px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-5 py-10 text-center text-sm font-medium text-[rgba(243,246,247,0.56)]">
            Aucun match disponible aujourd'hui.
          </div>
        )}
        <Pagination total={total} totalPages={totalPages} currentPage={currentPage} perPage={perPage} visibleCount={matches.length} />
      </section>

      {/* Desktop (≥ lg) : tableau historique préservé */}
      <section className="hidden w-full max-w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[rgba(7,16,24,0.82)] shadow-[0_18px_50px_rgba(0,0,0,0.26)] lg:block">
        <div className="grid h-12 grid-cols-[minmax(150px,1.1fr)_72px_minmax(280px,1.6fr)_112px_86px_120px_52px] items-center gap-3 border-b border-white/[0.06] px-4 text-[11px] font-extrabold uppercase tracking-[0.10em] text-[rgba(243,246,247,0.48)]">
          <span>Ligue</span>
          <span>Heure</span>
          <span>Match</span>
          <span>Résultat Sim</span>
          <span>+2,5 buts</span>
          <span>Confiance</span>
          <span className="text-center">Actions</span>
        </div>

        {matches.length > 0 ? (
          <div>
            {matches.map((match) => (
              <MatchTableRow key={match.fixture_id} match={match} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm font-medium text-[rgba(243,246,247,0.56)]">
            Aucun match disponible aujourd'hui.
          </div>
        )}

        <Pagination total={total} totalPages={totalPages} currentPage={currentPage} perPage={perPage} visibleCount={matches.length} />
      </section>
    </>
  );
}

function MatchTableRow({ match }: { match: MatchSummary }) {
  const result = resultSim(match);
  const country = inferCountry(match);

  return (
    <div className="relative grid min-h-[82px] grid-cols-[minmax(150px,1.1fr)_72px_minmax(280px,1.6fr)_112px_86px_120px_52px] items-center gap-3 border-b border-white/[0.06] px-4 transition-colors last:border-b-0 hover:bg-[rgba(53,231,90,0.04)]">
      {/*
        Overlay clickable plein-cadre — toute la ligne ouvre /match/[fixture_id].
        Les éléments interactifs (FavoriteButton, etc.) restent positionnés avec
        `relative z-10` pour passer au-dessus.
      */}
      <Link
        href={`/match/${match.fixture_id}?source=matches`}
        aria-label={`${match.home_team.name} contre ${match.away_team.name}`}
        className="absolute inset-0 z-0"
      />
      <LeagueCell match={match} country={country} />
      <div className="relative z-[1] font-mono text-sm font-bold text-[#F3F6F7]">{formatTime(match.date)}</div>
      <MatchCell match={match} />
      <ResultCell result={result} />
      <Over25Cell value={over25DisplayProbability(match)} />
      <ConfidenceCell value={result.confidence || match.winner_proba || over25DisplayProbability(match)} />
      <ActionCell match={match} />
    </div>
  );
}

function LeagueCell({ match, country }: { match: MatchSummary; country: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <CountryFlag country={country} league={match.league.name} flag={match.league.flag} />
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-[#F3F6F7]">{match.league.name || "Ligue"}</div>
        <div className="truncate text-[13px] font-medium text-[rgba(243,246,247,0.50)]">{country || "Pays"}</div>
      </div>
    </div>
  );
}

function MatchCell({ match }: { match: MatchSummary }) {
  // Plus de Link interne — le clic est géré par l'overlay plein-cadre au niveau
  // de la ligne. On reste sur un simple <div> pour éviter les liens imbriqués
  // (anti-pattern accessibilité + hydration warnings).
  return (
    <div className="relative z-[1] grid min-w-0 grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] items-center gap-2.5">
      <TeamSide name={match.home_team.name} logo={teamLogo(match, "home")} align="right" />
      <span className="text-center text-xs font-bold text-[rgba(243,246,247,0.46)]">VS</span>
      <TeamSide name={match.away_team.name} logo={teamLogo(match, "away")} align="left" />
    </div>
  );
}

function TeamSide({ name, logo, align }: { name: string; logo: string; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {align === "right" && <span className="min-w-0 truncate text-right text-[14px] font-bold text-[#F3F6F7]">{name}</span>}
      <TeamLogo name={name} logo={logo} />
      {align === "left" && <span className="min-w-0 truncate text-left text-[14px] font-bold text-[#F3F6F7]">{name}</span>}
    </div>
  );
}

function TeamLogo({ name, logo }: { name: string; logo: string }) {
  if (logo) return <img src={logo} alt={name} className="h-[30px] w-[30px] shrink-0 object-contain" />;

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-extrabold tracking-[0.04em] text-[rgba(243,246,247,0.88)]">
      {getTeamInitials(name)}
    </span>
  );
}

function ResultCell({ result }: { result: ResultSim }) {
  return (
    <div className="flex h-[46px] w-[104px] flex-col items-center justify-center rounded-xl border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-center">
      <div className="text-lg font-black leading-none text-[#35E75A]">{result.code}</div>
      <div className="mt-1 max-w-[92px] truncate text-[10px] font-bold leading-none text-[#DFFFE8]">{result.label}</div>
    </div>
  );
}

function Over25Cell({ value }: { value: number }) {
  return (
    <div className="flex h-[46px] w-[78px] flex-col items-center justify-center rounded-xl border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-center">
      <div className="text-lg font-black leading-none text-[#35E75A]">+2.5</div>
      <div className="mt-1 text-xs font-black leading-none text-[#35E75A]">{Math.round(value * 100)}%</div>
    </div>
  );
}

function ConfidenceCell({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <div className="w-[104px]">
      <div className="mb-2 text-sm font-black leading-none text-[#35E75A]">{pct}%</div>
      <div className="h-2 w-[100px] overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-[#35E75A]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ActionCell({ match }: { match: MatchSummary }) {
  // relative z-10 pour passer au-dessus de l'overlay Link plein-cadre de la ligne.
  return (
    <div className="relative z-10 flex justify-center">
      <FavoriteButton match={match} source="matches" tab="over25" analysisType="over25" />
    </div>
  );
}

function Pagination({
  total,
  totalPages,
  currentPage,
  perPage,
  visibleCount,
}: {
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  visibleCount: number;
}) {
  const pages = Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]))
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = total === 0 ? 0 : start + visibleCount - 1;

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-4">
      <div className="text-sm font-medium text-[rgba(243,246,247,0.56)]">
        Affichage de {start} à {end} sur {total} matchs
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <PageButton href={`/matches?page=${Math.max(1, currentPage - 1)}`} disabled={currentPage <= 1}>
            <ChevronLeft size={15} />
          </PageButton>
          {pages.map((page, index) => (
            <span key={page} className="flex items-center gap-2">
              {index > 0 && page - pages[index - 1] > 1 && (
                <span className="px-1 text-sm text-[rgba(243,246,247,0.42)]">...</span>
              )}
              <PageButton href={`/matches?page=${page}`} active={page === currentPage}>
                {page}
              </PageButton>
            </span>
          ))}
          <PageButton href={`/matches?page=${Math.min(totalPages, currentPage + 1)}`} disabled={currentPage >= totalPages}>
            <ChevronRight size={15} />
          </PageButton>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-semibold text-[rgba(243,246,247,0.72)]">
          20 par page
          <ChevronDown size={14} />
        </div>
      </div>
    </footer>
  );
}

function PageButton({ active, disabled, href, children }: { active?: boolean; disabled?: boolean; href?: string; children: ReactNode }) {
  const className = `flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-bold transition-colors ${
    active
      ? "border-[rgba(53,231,90,0.30)] bg-[#35E75A] text-[#03080A]"
      : disabled
        ? "pointer-events-none border-white/[0.04] bg-white/[0.02] text-[rgba(243,246,247,0.28)]"
        : "border-white/[0.08] bg-white/[0.03] text-[rgba(243,246,247,0.72)] hover:border-[rgba(53,231,90,0.20)] hover:text-[#35E75A]"
  }`;

  if (href && !disabled) {
    return <Link href={href} className={className}>{children}</Link>;
  }

  return (
    <button type="button" disabled={disabled} className={className}>
      {children}
    </button>
  );
}
