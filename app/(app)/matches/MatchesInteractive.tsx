"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { MatchCard } from "@/components/matches/MatchCard";

type Day = "today" | "tomorrow";
type ResultCode = "all" | "1" | "N" | "2";
type Over25Bucket = "all" | "high" | "mid" | "low";

const PER_PAGE = 20;

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

function isFinished(match: MatchSummary): boolean {
  return FINISHED_STATUSES.has(String(match.status?.code || "").toUpperCase());
}

function formatTime(iso: string): string {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

// Utilise result_selection (peut inclure double chance) sinon argmax des probas
function resultPick(match: MatchSummary): { code: string; label: string; proba: number } {
  const rs = match.result_selection;
  if (rs?.is_result_selection && rs.pick && rs.probability != null) {
    return { code: rs.pick, label: rs.label || rs.pick, proba: rs.probability };
  }
  const p = match.probabilities;
  const arr = [
    { c: "1", v: p.home_win || 0, l: "Victoire domicile" },
    { c: "N", v: p.draw || 0, l: "Match nul" },
    { c: "2", v: p.away_win || 0, l: "Victoire extérieur" },
  ].sort((a, b) => b.v - a.v);
  return { code: arr[0].c, label: arr[0].l, proba: arr[0].v };
}

function resultCode(match: MatchSummary): "1" | "N" | "2" {
  // Compat: pour le filtre "Résultats" on ne prend en compte que les singles
  const p = match.probabilities;
  const arr: Array<{ c: "1" | "N" | "2"; v: number }> = [
    { c: "1", v: p.home_win || 0 },
    { c: "N", v: p.draw || 0 },
    { c: "2", v: p.away_win || 0 },
  ];
  return arr.sort((a, b) => b.v - a.v)[0].c;
}

export function MatchesInteractive({
  today,
  tomorrow,
}: {
  today: MatchSummary[];
  tomorrow: MatchSummary[];
}) {
  const [day, setDay] = useState<Day>("today");
  const [league, setLeague] = useState<string>("all");
  const [result, setResult] = useState<ResultCode>("all");
  const [over25, setOver25] = useState<Over25Bucket>("all");
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const rawMatches = day === "today" ? today : tomorrow;

  const leagues = useMemo(() => {
    const set = new Map<string, string>();
    for (const m of [...today, ...tomorrow]) {
      const name = m.league?.name || "";
      if (name) set.set(name, name);
    }
    return Array.from(set.keys()).sort();
  }, [today, tomorrow]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return rawMatches.filter((m) => {
      if (league !== "all" && m.league?.name !== league) return false;
      if (result !== "all" && resultCode(m) !== result) return false;
      if (over25 !== "all") {
        const v = over25DisplayProbability(m) || 0;
        if (over25 === "high" && v < 0.65) return false;
        if (over25 === "mid" && (v < 0.5 || v >= 0.65)) return false;
        if (over25 === "low" && v >= 0.5) return false;
      }
      if (q) {
        const hay = normalize(`${m.home_team.name} ${m.away_team.name} ${m.league?.name || ""}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rawMatches, league, result, over25, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const resetToPage1 = () => setPage(1);

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <SelectBox
            label="Date"
            value={day}
            onChange={(v) => {
              setDay(v as Day);
              resetToPage1();
            }}
            options={[
              { value: "today", label: "Aujourd'hui" },
              { value: "tomorrow", label: "Demain" },
            ]}
          />
          <SelectBox
            label="Championnats"
            value={league}
            onChange={(v) => {
              setLeague(v);
              resetToPage1();
            }}
            options={[{ value: "all", label: "Tous" }, ...leagues.map((l) => ({ value: l, label: l }))]}
          />
          <SelectBox
            label="Résultats"
            value={result}
            onChange={(v) => {
              setResult(v as ResultCode);
              resetToPage1();
            }}
            options={[
              { value: "all", label: "Tous" },
              { value: "1", label: "Victoire domicile" },
              { value: "N", label: "Match nul" },
              { value: "2", label: "Victoire extérieur" },
            ]}
          />
          <SelectBox
            label="+2,5 buts"
            value={over25}
            onChange={(v) => {
              setOver25(v as Over25Bucket);
              resetToPage1();
            }}
            options={[
              { value: "all", label: "Tous" },
              { value: "high", label: "≥ 65%" },
              { value: "mid", label: "50–65%" },
              { value: "low", label: "< 50%" },
            ]}
          />
        </div>
        <div className="flex h-[52px] w-full max-w-[360px] min-w-[260px] items-center gap-3 rounded-[14px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-4 text-sm text-[#F3F6F7]">
          <Search size={18} className="shrink-0 text-[rgba(243,246,247,0.48)]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetToPage1();
            }}
            placeholder="Rechercher un match, une équipe..."
            className="w-full bg-transparent placeholder-[rgba(243,246,247,0.44)] focus:outline-none"
          />
        </div>
      </section>

      {/* Mobile */}
      <section className="space-y-3 lg:hidden">
        {visible.length > 0 ? (
          visible.map((match) => (
            <MatchCard key={match.fixture_id} match={match} href={`/match/${match.fixture_id}?source=matches`} />
          ))
        ) : (
          <EmptyState day={day} />
        )}
        <Pagination total={filtered.length} totalPages={totalPages} currentPage={currentPage} onGo={setPage} visibleCount={visible.length} />
      </section>

      {/* Desktop */}
      <section className="hidden w-full max-w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[rgba(7,16,24,0.82)] shadow-[0_18px_50px_rgba(0,0,0,0.26)] lg:block">
        <div className="grid h-12 grid-cols-[minmax(140px,1fr)_64px_minmax(260px,1.5fr)_100px_74px_74px_74px_100px_52px] items-center gap-3 border-b border-white/[0.06] px-4 text-[11px] font-extrabold uppercase tracking-[0.10em] text-[rgba(243,246,247,0.48)]">
          <span>Ligue</span>
          <span>Heure</span>
          <span>Match</span>
          <span>Résultat</span>
          <span>+2,5</span>
          <span>+1,5</span>
          <span>BTTS</span>
          <span>Confiance</span>
          <span className="text-center">Actions</span>
        </div>
        {visible.length > 0 ? (
          <div>
            {visible.map((m) => (
              <MatchRow key={m.fixture_id} match={m} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm font-medium text-[rgba(243,246,247,0.56)]">
            <EmptyText day={day} />
          </div>
        )}
        <Pagination total={filtered.length} totalPages={totalPages} currentPage={currentPage} onGo={setPage} visibleCount={visible.length} />
      </section>
    </>
  );
}

function EmptyText({ day }: { day: Day }) {
  return <>Aucun match disponible {day === "today" ? "aujourd'hui" : "demain"} avec ces filtres.</>;
}

function EmptyState({ day }: { day: Day }) {
  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-5 py-10 text-center text-sm font-medium text-[rgba(243,246,247,0.56)]">
      <EmptyText day={day} />
    </div>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <div className="relative flex h-[52px] min-w-[150px] items-center rounded-[14px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)]">
      <div className="pointer-events-none flex flex-1 flex-col px-4">
        <span className="text-[11px] font-medium text-[rgba(243,246,247,0.42)]">{label}</span>
        <span className="mt-0.5 truncate text-sm font-bold text-[#F3F6F7]">{current}</span>
      </div>
      <ChevronDown size={15} className="pointer-events-none mr-3 text-[rgba(243,246,247,0.58)]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none bg-transparent text-transparent focus:outline-none"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#07131c] text-[#F3F6F7]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MatchRow({ match }: { match: MatchSummary }) {
  const pick = resultPick(match);
  const code = pick.code;
  const label = pick.label;
  const finished = isFinished(match);
  const homeGoals = match.score?.home;
  const awayGoals = match.score?.away;

  return (
    <div className="relative grid min-h-[82px] grid-cols-[minmax(140px,1fr)_64px_minmax(260px,1.5fr)_100px_74px_74px_74px_100px_52px] items-center gap-3 border-b border-white/[0.06] px-4 transition-colors last:border-b-0 hover:bg-[rgba(53,231,90,0.04)]">
      <Link
        href={`/match/${match.fixture_id}?source=matches`}
        aria-label={`${match.home_team.name} contre ${match.away_team.name}`}
        className="absolute inset-0 z-0"
      />
      <div className="flex min-w-0 items-center gap-2.5">
        <CountryFlag country={match.league?.country || ""} league={match.league?.name || ""} flag={match.league?.flag || ""} />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[#F3F6F7]">{match.league?.name || "Ligue"}</div>
          <div className="truncate text-[13px] font-medium text-[rgba(243,246,247,0.50)]">{match.league?.country || ""}</div>
        </div>
      </div>
      <div className="relative z-[1] font-mono text-sm font-bold text-[#F3F6F7]">{formatTime(match.date)}</div>
      <div className="relative z-[1] grid min-w-0 grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] items-center gap-2.5">
        <TeamMini name={match.home_team.name} logo={match.home_team.logo} align="right" />
        {finished && homeGoals != null && awayGoals != null ? (
          <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-center text-xs font-black text-[#F3F6F7]">
            {homeGoals}-{awayGoals}
          </span>
        ) : (
          <span className="text-center text-xs font-bold text-[rgba(243,246,247,0.46)]">VS</span>
        )}
        <TeamMini name={match.away_team.name} logo={match.away_team.logo} align="left" />
      </div>
      {finished ? (
        <div className="flex h-[46px] w-[92px] flex-col items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-center">
          <div className="text-[10px] font-bold uppercase leading-none text-[rgba(243,246,247,0.60)]">Terminé</div>
          <div className="mt-1 text-xs font-black leading-none text-[#F3F6F7]">
            {homeGoals ?? "-"}–{awayGoals ?? "-"}
          </div>
        </div>
      ) : (
        <div className="flex h-[46px] w-[92px] flex-col items-center justify-center rounded-xl border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-center">
          <div className="text-lg font-black leading-none text-[#35E75A]">{code}</div>
          <div className="mt-1 max-w-[84px] truncate text-[10px] font-bold leading-none text-[#DFFFE8]">{label}</div>
        </div>
      )}
      <MarketCell label="+2.5" value={over25DisplayProbability(match) || 0} />
      <MarketCell label="+1.5" value={match.probabilities.over_15 || 0} />
      <MarketCell label="BTTS" value={match.probabilities.btts || 0} />
      <div className="w-[104px]">
        <div className="mb-2 text-sm font-black leading-none text-[#35E75A]">
          {Math.round(pick.proba * 100)}%
        </div>
        <div className="h-2 w-[100px] overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[#35E75A]"
            style={{
              width: `${Math.round(pick.proba * 100)}%`,
            }}
          />
        </div>
      </div>
      <div className="relative z-10 flex justify-center">
        <FavoriteButton match={match} source="matches" tab="over25" analysisType="over25" />
      </div>
    </div>
  );
}

function MarketCell({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value || 0) * 100);
  const tone = pct >= 65 ? "text-[#35E75A] border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)]"
    : pct >= 50 ? "text-[#D8AF3A] border-[rgba(216,175,58,0.20)] bg-[rgba(216,175,58,0.08)]"
    : pct > 0 ? "text-[#E85B5B] border-[rgba(232,91,91,0.18)] bg-[rgba(232,91,91,0.07)]"
    : "text-[rgba(243,246,247,0.45)] border-white/[0.08] bg-white/[0.03]";
  return (
    <div className={`flex h-[46px] w-[66px] flex-col items-center justify-center rounded-xl border text-center ${tone}`}>
      <div className="text-[10px] font-black leading-none opacity-90">{label}</div>
      <div className="mt-1 text-xs font-black leading-none">{pct}%</div>
    </div>
  );
}

function TeamMini({ name, logo, align }: { name: string; logo: string; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {align === "right" && <span className="min-w-0 truncate text-right text-[14px] font-bold text-[#F3F6F7]">{name}</span>}
      {logo ? (
        <img src={logo} alt={name} className="h-[30px] w-[30px] shrink-0 object-contain" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-extrabold text-[rgba(243,246,247,0.88)]">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      {align === "left" && <span className="min-w-0 truncate text-left text-[14px] font-bold text-[#F3F6F7]">{name}</span>}
    </div>
  );
}

function Pagination({
  total,
  totalPages,
  currentPage,
  onGo,
  visibleCount,
}: {
  total: number;
  totalPages: number;
  currentPage: number;
  onGo: (n: number) => void;
  visibleCount: number;
}) {
  const pages = Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]))
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const start = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const end = total === 0 ? 0 : start + visibleCount - 1;
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-4">
      <div className="text-sm font-medium text-[rgba(243,246,247,0.56)]">
        Affichage de {start} à {end} sur {total} matchs
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <PgBtn onClick={() => onGo(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            <ChevronLeft size={15} />
          </PgBtn>
          {pages.map((p, i) => (
            <span key={p} className="flex items-center gap-2">
              {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-sm text-[rgba(243,246,247,0.42)]">...</span>}
              <PgBtn onClick={() => onGo(p)} active={p === currentPage}>
                {p}
              </PgBtn>
            </span>
          ))}
          <PgBtn onClick={() => onGo(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
            <ChevronRight size={15} />
          </PgBtn>
        </div>
      </div>
    </footer>
  );
}

function PgBtn({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const cls = `flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-bold transition-colors ${
    active
      ? "border-[rgba(53,231,90,0.30)] bg-[#35E75A] text-[#03080A]"
      : disabled
        ? "pointer-events-none border-white/[0.04] bg-white/[0.02] text-[rgba(243,246,247,0.28)]"
        : "border-white/[0.08] bg-white/[0.03] text-[rgba(243,246,247,0.72)] hover:border-[rgba(53,231,90,0.20)] hover:text-[#35E75A]"
  }`;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
