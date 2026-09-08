"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Search, Star, X } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import {
  favoriteFixtureId,
  favoriteTypeFromRecord,
  favoriteToMatch,
  type FavoriteRecord,
  useFavorites,
} from "@/lib/favorites";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { getTeamInitials, teamLogoFromMatchesMapping } from "@/components/match/matchUtils";

type FavoriteFilter = "all" | "upcoming" | "smart" | "over25" | "result" | "over15" | "btts";
type FavoriteKind = "smart-over25" | "smart-result" | "over25" | "result" | "over15" | "btts" | "unknown";

type FavoriteItem = {
  favorite: FavoriteRecord;
  match: MatchSummary | null;
  kind: FavoriteKind;
};

const FILTERS: Array<{ key: FavoriteFilter; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "upcoming", label: "À venir" },
  { key: "smart", label: "Smart Sim" },
  { key: "over25", label: "+2,5" },
  { key: "result", label: "Résultat" },
  { key: "over15", label: "+1,5" },
  { key: "btts", label: "L2M" },
];

export default function FavoritesPage() {
  const { favorites, ready, removeFavorite } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<FavoriteFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const favoriteItems = useMemo(() => buildFavoriteItems(favorites), [favorites]);
  const visibleItems = useMemo(
    () => filterAndSortFavorites(favoriteItems, activeFilter, search),
    [favoriteItems, activeFilter, search]
  );
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = visibleItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="w-full max-w-full min-w-0 space-y-5 overflow-x-hidden">
      <FavoritesHero />

      <FavoritesFilters
        activeFilter={activeFilter}
        onFilter={(filter) => { setActiveFilter(filter); setPage(1); }}
        search={search}
        onSearch={(value) => { setSearch(value); setPage(1); }}
      />

      {!ready && (
        <div className="flex items-center justify-center rounded-[24px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] py-20 text-[rgba(243,246,247,0.58)]">
          Chargement des favoris…
        </div>
      )}

      {ready && (
        <section className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[rgba(7,16,24,0.82)] shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-[-0.04em] text-[#F3F6F7]">Tous mes favoris</h2>
                <span className="inline-flex h-7 items-center rounded-full border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.08)] px-3 text-xs font-extrabold text-[#35E75A]">
                  {visibleItems.length} matchs
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-[rgba(243,246,247,0.54)]">
                Une seule liste pour tous les matchs ajoutés à ton suivi.
              </p>
            </div>
          </div>

          {visibleItems.length > 0 ? (
            <>
              <div className="space-y-3 p-4">
                {paginatedItems.map((item) => (
                  <FavoriteCard key={item.favorite.favoriteKey} item={item} onRemove={removeFavorite} />
                ))}
              </div>
              <ListPagination
                total={visibleItems.length}
                page={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                visibleCount={paginatedItems.length}
                onPage={setPage}
              />
            </>
          ) : (
            <EmptyState hasSearch={search.trim().length > 0} />
          )}
        </section>
      )}
    </div>
  );
}

function ListPagination({
  total,
  page,
  totalPages,
  perPage,
  visibleCount,
  onPage,
}: {
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  visibleCount: number;
  onPage: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = total === 0 ? 0 : start + visibleCount - 1;

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4">
      <span className="text-sm font-medium text-[rgba(243,246,247,0.56)]">
        Affichage de {start} à {end} sur {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[rgba(243,246,247,0.72)] transition-colors hover:border-[rgba(53,231,90,0.20)] hover:text-[#35E75A] disabled:pointer-events-none disabled:opacity-35"
        >
          ‹
        </button>
        <span className="min-w-16 text-center text-sm font-extrabold text-[#F3F6F7]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[rgba(243,246,247,0.72)] transition-colors hover:border-[rgba(53,231,90,0.20)] hover:text-[#35E75A] disabled:pointer-events-none disabled:opacity-35"
        >
          ›
        </button>
      </div>
    </footer>
  );
}

function FavoritesHero() {
  return (
    <header className="relative isolate min-h-[250px] overflow-hidden rounded-[32px] border border-[rgba(53,231,90,0.14)] bg-[#07131c] px-9 py-8 shadow-[0_14px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <img src="/stadium-night.jpg" alt="" className="absolute inset-0 -z-30 h-full w-full object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,12,18,0.90)_0%,rgba(5,12,18,0.70)_42%,rgba(5,12,18,0.34)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_76%,rgba(53,231,90,0.14),transparent_32%)]" />

      <div className="max-w-[720px]">
        <span className="mb-5 inline-flex h-[34px] w-fit items-center rounded-full border border-[rgba(53,231,90,0.28)] bg-[rgba(5,11,18,0.36)] px-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[#35E75A]">
          Suivi
        </span>
        <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.06em] text-white md:text-6xl">
          Favoris
        </h1>
        <p className="mt-5 max-w-[680px] text-lg leading-[1.5] text-[rgba(220,230,235,0.72)]">
          Retrouvez les matchs et analyses que vous avez ajoutés à votre suivi.
        </p>
      </div>
    </header>
  );
}

function FavoritesFilters({
  activeFilter,
  onFilter,
  search,
  onSearch,
}: {
  activeFilter: FavoriteFilter;
  onFilter: (filter: FavoriteFilter) => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2 rounded-[18px] border border-white/[0.08] bg-[rgba(7,16,24,0.62)] p-1.5">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilter(filter.key)}
              className={`h-10 rounded-[13px] border px-4 text-sm font-extrabold transition-colors ${
                active
                  ? "border-[rgba(53,231,90,0.26)] bg-[rgba(53,231,90,0.16)] text-[#35E75A]"
                  : "border-transparent text-[rgba(243,246,247,0.62)] hover:bg-white/[0.04] hover:text-[#F3F6F7]"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <div className="flex h-[52px] w-full max-w-[380px] min-w-[260px] items-center gap-3 rounded-[14px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-4">
        <Search size={18} className="shrink-0 text-[rgba(243,246,247,0.48)]" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Rechercher un match, une équipe..."
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#F3F6F7] outline-none placeholder:text-[rgba(243,246,247,0.42)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="text-[rgba(243,246,247,0.46)] transition-colors hover:text-[#F3F6F7]"
            aria-label="Effacer la recherche"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

function FavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: (favoriteKey: string) => void }) {
  const { favorite, match, kind } = item;
  const href = favoriteHref(item);
  const country = match?.league.country || "";
  const league = match?.league.name || favorite.league_name || "Ligue indisponible";
  const homeName = match?.home_team.name || favorite.label || "Équipe domicile";
  const awayName = match?.away_team.name || "Équipe extérieure";
  const value = favoriteValue(item);

  return (
    <Link
      href={href}
      className="group grid min-h-[104px] grid-cols-[230px_minmax(320px,1fr)_230px_72px] items-center gap-4 overflow-hidden rounded-[20px] border border-white/[0.06] bg-[rgba(5,12,18,0.70)] p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(53,231,90,0.22)] hover:bg-[rgba(8,18,25,0.80)] max-[1150px]:grid-cols-[1fr_72px] max-[1150px]:gap-3"
    >
      <div className="min-w-0 max-[1150px]:col-span-2">
        <div className="flex min-w-0 items-center gap-2">
          <CountryFlag country={country} league={league} flag={match?.league.flag} />
          <span className="truncate text-xs font-extrabold uppercase tracking-[0.08em] text-[rgba(243,246,247,0.70)]">
            {country ? `${country} · ${league}` : league}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[rgba(243,246,247,0.58)]">
          <CalendarDays size={14} className="text-[#35E75A]" />
          <span>{formatDate(match?.date)}</span>
          <span className="font-mono text-[#F3F6F7]">{formatTime(match?.date)}</span>
          <StatusBadge status={matchStatus(match)} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_30px_minmax(0,1fr)] items-center gap-2.5 max-[1150px]:col-span-2">
        <TeamSide name={homeName} logo={teamLogo(match, "home")} align="right" />
        <span className="text-center text-xs font-bold text-[rgba(243,246,247,0.46)]">VS</span>
        <TeamSide name={awayName} logo={teamLogo(match, "away")} align="left" />
      </div>

      <div className="flex min-w-0 items-center justify-end gap-3 max-[1150px]:justify-start">
        <AnalysisBadge kind={kind} />
        <div className="min-w-[74px] text-right max-[1150px]:text-left">
          <div className="text-sm font-black text-[#F3F6F7]">{value.primary}</div>
          <div className="mt-1 text-xs font-semibold text-[rgba(243,246,247,0.56)]">{value.secondary}</div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onRemove(favorite.favoriteKey);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-[#35E75A] transition-colors hover:bg-[rgba(53,231,90,0.16)]"
          aria-label="Retirer des favoris"
        >
          <Star size={18} className="fill-[#35E75A]" />
        </button>
        <ChevronRight size={17} className="text-[rgba(243,246,247,0.34)] transition-all group-hover:translate-x-0.5 group-hover:text-[#F3F6F7]" />
      </div>
    </Link>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="p-4">
      <div className="flex flex-col items-center justify-center rounded-[22px] border border-white/[0.07] bg-[rgba(5,12,18,0.62)] px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.10)]">
          <Star size={26} className="text-[#35E75A]" />
        </div>
        <h3 className="text-xl font-black text-[#F3F6F7]">Aucun favori trouvé</h3>
        <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-[rgba(243,246,247,0.58)]">
          {hasSearch
            ? "Aucun favori ne correspond à votre recherche."
            : "Ajoutez une étoile sur un match pour le retrouver ici rapidement."}
        </p>
        <Link
          href="/matches"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-[rgba(53,231,90,0.22)] bg-[rgba(53,231,90,0.08)] px-5 text-sm font-extrabold text-[#35E75A] transition-colors hover:bg-[rgba(53,231,90,0.14)]"
        >
          Voir tous les matchs
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function buildFavoriteItems(favorites: FavoriteRecord[]): FavoriteItem[] {
  return favorites
    .filter((favorite) => (favorite.fav_type || "match") === "match")
    .map((favorite) => {
      const match = favoriteToMatch(favorite);
      return {
        favorite,
        match,
        kind: favoriteKind(favorite, match),
      };
    });
}

function filterAndSortFavorites(items: FavoriteItem[], filter: FavoriteFilter, query: string): FavoriteItem[] {
  const search = normalize(query);
  return items
    .filter((item) => matchesFilter(item, filter))
    .filter((item) => {
      if (!search) return true;
      const match = item.match;
      const haystack = [
        item.favorite.label,
        item.favorite.league_name,
        match?.home_team.name,
        match?.away_team.name,
        match?.league.name,
        match?.league.country,
      ]
        .filter(Boolean)
        .join(" ");
      return normalize(haystack).includes(search);
    })
    .sort(compareFavoriteItems);
}

function matchesFilter(item: FavoriteItem, filter: FavoriteFilter): boolean {
  if (filter === "all") return true;
  if (filter === "upcoming") return matchStatus(item.match) === "À venir";
  if (filter === "smart") return item.kind === "smart-over25" || item.kind === "smart-result";
  if (filter === "over25") return item.kind === "over25" || item.kind === "smart-over25";
  if (filter === "result") return item.kind === "result" || item.kind === "smart-result";
  return item.kind === filter;
}

function compareFavoriteItems(a: FavoriteItem, b: FavoriteItem): number {
  const rankDiff = statusRank(a.match) - statusRank(b.match);
  if (rankDiff !== 0) return rankDiff;

  const aTime = timeValue(a.match?.date) || timeValue(a.favorite.createdAt);
  const bTime = timeValue(b.match?.date) || timeValue(b.favorite.createdAt);

  if (matchStatus(a.match) === "Terminé" && matchStatus(b.match) === "Terminé") {
    return bTime - aTime;
  }
  return aTime - bTime;
}

function favoriteKind(favorite: FavoriteRecord, match: MatchSummary | null): FavoriteKind {
  const raw = normalize([favoriteTypeFromRecord(favorite), favorite.source, favorite.tab, favorite.label].filter(Boolean).join(" "));
  if (raw.includes("smart") && (raw.includes("result") || raw.includes("resultat"))) return "smart-result";
  if (raw.includes("smart") && (raw.includes("2,5") || raw.includes("2.5") || raw.includes("over25"))) return "smart-over25";
  if (raw.includes("smart") && match?.is_smart_bet) return "smart-over25";
  if (raw.includes("over15") || raw.includes("1,5") || raw.includes("1.5")) return "over15";
  if (raw.includes("btts") || raw.includes("l2m")) return "btts";
  if (raw.includes("result") || raw.includes("resultat")) return "result";
  if (raw.includes("over25") || raw.includes("2,5") || raw.includes("2.5")) return "over25";
  return match?.is_smart_bet ? "smart-over25" : "unknown";
}

function favoriteHref(item: FavoriteItem): string {
  const fixtureId = item.match?.fixture_id || favoriteFixtureId(item.favorite);
  if (item.kind === "smart-over25") return `/match/${fixtureId}?source=smart-over25`;
  if (item.kind === "smart-result") return `/match/${fixtureId}?source=smart-result`;
  if (item.kind === "result") return `/match/${fixtureId}?source=matches&tab=result`;
  if (item.kind === "over15") return `/match/${fixtureId}?source=matches&tab=over15`;
  if (item.kind === "btts") return `/match/${fixtureId}?source=matches&tab=btts`;
  return `/match/${fixtureId}?source=matches&tab=over25`;
}

function favoriteValue(item: FavoriteItem): { primary: string; secondary: string } {
  const match = item.match;
  if (item.kind === "smart-result" || item.kind === "result") {
    const result = resultPick(match);
    return { primary: result.code, secondary: result.confidence === null ? "Indisponible" : `Confiance ${formatPct(result.confidence)}` };
  }
  if (item.kind === "over15") return { primary: "+1,5 buts", secondary: formatOptionalPct(match?.probabilities.over_15) };
  if (item.kind === "btts") return { primary: "L2M", secondary: formatOptionalPct(match?.probabilities.btts) };
  return { primary: "+2,5 buts", secondary: formatOptionalPct(match?.probabilities.over_25) };
}

function resultPick(match: MatchSummary | null): { code: "1" | "N" | "2" | "—"; confidence: number | null } {
  if (!match) return { code: "—", confidence: null };
  const entries = [
    { code: "1" as const, confidence: match.probabilities.home_win },
    { code: "N" as const, confidence: match.probabilities.draw },
    { code: "2" as const, confidence: match.probabilities.away_win },
  ].filter((item) => Number.isFinite(item.confidence) && item.confidence > 0);
  return entries.sort((a, b) => b.confidence - a.confidence)[0] || { code: "—", confidence: null };
}

function AnalysisBadge({ kind }: { kind: FavoriteKind }) {
  const labelByKind: Record<FavoriteKind, string> = {
    "smart-over25": "Smart Sim +2,5",
    "smart-result": "Smart Sim Résultat",
    over25: "+2,5 buts",
    result: "Résultat",
    over15: "+1,5",
    btts: "L2M",
    unknown: "Analyse",
  };
  const tone =
    kind === "smart-result"
      ? "border-violet-300/20 bg-violet-400/10 text-violet-100"
      : kind === "result"
        ? "border-amber-300/18 bg-amber-300/10 text-amber-100"
        : "border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-[#DFFFE8]";

  return (
    <span className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[11px] font-black uppercase tracking-[0.08em] ${tone}`}>
      {labelByKind[kind]}
    </span>
  );
}

function TeamSide({ name, logo, align }: { name: string; logo: string; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {align === "right" && <span className="min-w-0 truncate text-right text-[15px] font-bold text-[#F3F6F7]">{name}</span>}
      <TeamLogo name={name} logo={logo} />
      {align === "left" && <span className="min-w-0 truncate text-left text-[15px] font-bold text-[#F3F6F7]">{name}</span>}
    </div>
  );
}

function TeamLogo({ name, logo }: { name: string; logo: string }) {
  if (logo) return <img src={logo} alt={name} className="h-8 w-8 shrink-0 object-contain" loading="lazy" />;

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-extrabold tracking-[0.04em] text-[rgba(243,246,247,0.88)]">
      {getTeamInitials(name)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Live"
      ? "border-[#35E75A]/24 bg-[#35E75A]/10 text-[#35E75A]"
      : status === "Terminé"
        ? "border-white/10 bg-white/[0.04] text-[rgba(243,246,247,0.58)]"
        : "border-[rgba(53,231,90,0.18)] bg-[rgba(53,231,90,0.08)] text-[#DFFFE8]";

  return <span className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-extrabold ${tone}`}>{status}</span>;
}

function teamLogo(match: MatchSummary | null, side: "home" | "away"): string {
  if (!match) return "";
  return teamLogoFromMatchesMapping(side === "home" ? match.home_team : match.away_team);
}

function matchStatus(match: MatchSummary | null): "Live" | "À venir" | "Terminé" {
  const code = match?.status?.code?.toUpperCase();
  if (code === "1H" || code === "2H" || code === "HT" || code === "LIVE") return "Live";
  if (code === "FT" || code === "AET" || code === "PEN") return "Terminé";
  return "À venir";
}

function statusRank(match: MatchSummary | null): number {
  const status = matchStatus(match);
  if (status === "Live") return 0;
  if (status === "À venir") return 1;
  return 2;
}

function formatDate(iso?: string): string {
  if (!iso) return "Date indisponible";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso?: string): string {
  if (!iso) return "--:--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatOptionalPct(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? `Probabilité ${formatPct(value)}` : "Indisponible";
}

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function timeValue(iso?: string): number {
  if (!iso) return Number.MAX_SAFE_INTEGER;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
