"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Search,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { HistoryApiItem } from "@/lib/api";

type CategoryKey = "ss_over25" | "ss_over25_plus" | "ss_result" | "result";
type Status = "won" | "lost" | "pending" | "void";
type ResultCode = "1" | "N" | "2" | "1N" | "N2" | "12";

type Team = { name: string; logo: string };

type BaseRow = {
  id: string;
  date: string;
  time: string;
  league: string;
  country: string;
  flag?: string;
  home: Team;
  away: Team;
  finalScore: string;
  resultLabel: string;
  status: Status;
};

type Over25Row = BaseRow & { kind: "over25"; probability: number; goals: number };
type ResultRow = BaseRow & {
  kind: "result";
  selection: ResultCode;
  selectionLabel: string;
  confidence: number;
};

type Row = Over25Row | ResultRow;

type Category = {
  key: CategoryKey;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: "green" | "violet" | "gold";
  kind: "over25" | "result";
};

const CATEGORIES: Category[] = [
  {
    key: "ss_over25",
    title: "Smart Sim +2,5",
    subtitle: "Sélections +2,5 buts basées sur une évidence statistique.",
    icon: <SmartBallIcon />,
    accent: "green",
    kind: "over25",
  },
  {
    key: "ss_over25_plus",
    title: "SS+ +2,5 (Value)",
    subtitle: "Sélections +2,5 déclenchées comme value bets (★) — modèle > marché.",
    icon: <Star size={22} strokeWidth={2.4} />,
    accent: "violet",
    kind: "over25",
  },
  {
    key: "ss_result",
    title: "Smart Sim Résultat",
    subtitle: "Picks de résultat portés par un signal Smart Sim.",
    icon: <Trophy size={24} />,
    accent: "gold",
    kind: "result",
  },
  {
    key: "result",
    title: "Autres avis résultat",
    subtitle: "Avis résultat sur les matchs hors Smart Sim.",
    icon: <Trophy size={24} />,
    accent: "gold",
    kind: "result",
  },
];

const ACCENT_STYLES: Record<Category["accent"], { border: string; ring: string; text: string; bg: string }> = {
  green: {
    border: "border-[rgba(53,231,90,0.28)]",
    ring: "border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.10)] text-[#35E75A]",
    text: "text-[#35E75A]",
    bg: "bg-[rgba(53,231,90,0.06)]",
  },
  violet: {
    border: "border-[rgba(123,92,255,0.35)]",
    ring: "border-[rgba(123,92,255,0.32)] bg-[rgba(123,92,255,0.12)] text-[#B7A2FF]",
    text: "text-[#B7A2FF]",
    bg: "bg-[rgba(123,92,255,0.06)]",
  },
  gold: {
    border: "border-[rgba(245,197,66,0.28)]",
    ring: "border-[rgba(245,197,66,0.24)] bg-[rgba(245,197,66,0.10)] text-[#F5C542]",
    text: "text-[#F5C542]",
    bg: "bg-[rgba(245,197,66,0.06)]",
  },
};

function getTeamInitials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !["fc", "sc", "cf", "ac", "as", "afc", "rc", "club", "football"].includes(part.toLowerCase()))
    .filter((part) => !/^\d+$/.test(part))
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .padEnd(2, name[0] || "?")
    .toUpperCase();
}

function formatDate(value: string): string {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      timeZone: "Europe/Paris",
    });
  } catch { return value.slice(0, 10); }
}

function formatTime(value: string): string {
  if (!value) return "--:--";
  try {
    return new Date(value).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  } catch { return "--:--"; }
}

function percent(v: number | null | undefined): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.round(v * 100);
}

function mapBase(item: HistoryApiItem): BaseRow {
  return {
    id: `${item.type}:${item.fixture_id}:${item.is_value ? "v" : "e"}`,
    date: formatDate(item.date),
    time: formatTime(item.date),
    league: item.league.name || "Ligue",
    country: item.league.country || "",
    flag: item.league.flag,
    home: { name: item.home_team.name, logo: item.home_team.logo },
    away: { name: item.away_team.name, logo: item.away_team.logo },
    finalScore: item.final_score || "—",
    resultLabel: item.result_label || item.goals_label || "",
    status: item.status === "void" ? "pending" : item.status,
  };
}

function mapOver25(item: HistoryApiItem): Over25Row {
  const totalGoals = (item.score.home ?? 0) + (item.score.away ?? 0);
  return {
    ...mapBase(item),
    kind: "over25",
    probability: percent(item.selection.probability),
    goals: totalGoals,
    resultLabel: item.goals_label || `${totalGoals} buts`,
  };
}

function mapResult(item: HistoryApiItem): ResultRow {
  return {
    ...mapBase(item),
    kind: "result",
    selection: (item.selection.pick || "1") as ResultCode,
    selectionLabel: item.selection.label || "Avis résultat",
    confidence: percent(item.selection.probability),
  };
}

type PeriodKey = "7d" | "30d" | "all";
const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string; days: number | null }> = [
  { key: "7d", label: "7 derniers jours", days: 7 },
  { key: "30d", label: "30 derniers jours", days: 30 },
  { key: "all", label: "Tout l'historique", days: null },
];

export function HistoryClient({ items }: { items: HistoryApiItem[] }) {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<CategoryKey>>(new Set());
  const [search, setSearch] = useState<Record<CategoryKey, string>>({
    ss_over25: "", ss_over25_plus: "", ss_result: "", result: "",
  });

  const filteredItems = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const opt = PERIOD_OPTIONS.find((o) => o.key === period)!;
    const minDate = opt.days == null ? null : new Date(now.getTime() - opt.days * 86400_000);
    return items.filter((it) => {
      if (!it.date) return false;
      const d = new Date(it.date);
      if (Number.isNaN(d.getTime())) return false;
      if (d.getTime() > todayEnd.getTime()) return false;
      if (minDate && d.getTime() < minDate.getTime()) return false;
      return true;
    });
  }, [items, period]);

  // Split into 4 buckets
  const buckets = useMemo(() => {
    const ss_over25: Row[] = [];
    const ss_over25_plus: Row[] = [];
    const ss_result: Row[] = [];
    const result: Row[] = [];
    for (const it of filteredItems) {
      if (it.type === "smart-over25") {
        // Value bet (SS+) → uses kelly_market or is_value flag
        if (it.is_value) ss_over25_plus.push(mapOver25(it));
        else ss_over25.push(mapOver25(it));
      } else if (it.type === "smart-result") {
        ss_result.push(mapResult(it));
      } else if (it.type === "result") {
        result.push(mapResult(it));
      }
    }
    return { ss_over25, ss_over25_plus, ss_result, result } as Record<CategoryKey, Row[]>;
  }, [filteredItems]);

  const stats = useMemo(() => {
    const compute = (rows: BaseRow[]) => {
      const won = rows.filter((r) => r.status === "won").length;
      const lost = rows.filter((r) => r.status === "lost").length;
      const pending = rows.filter((r) => r.status === "pending").length;
      const settled = won + lost;
      const rate = settled > 0 ? Math.round((won / settled) * 100) : null;
      return { won, lost, pending, settled, rate, total: rows.length };
    };
    return {
      ss_over25: compute(buckets.ss_over25),
      ss_over25_plus: compute(buckets.ss_over25_plus),
      ss_result: compute(buckets.ss_result),
      result: compute(buckets.result),
    } as Record<CategoryKey, ReturnType<typeof compute>>;
  }, [buckets]);

  function toggle(key: CategoryKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-5 overflow-x-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#F3F6F7] md:text-5xl">Historique</h1>
          <p className="mt-3 text-base leading-relaxed text-[rgba(243,246,247,0.72)]">
            Chaque catégorie affiche son taux de réussite. Clique sur « Voir le détail » pour dérouler ses matchs.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPeriodOpen((v) => !v)}
            className="inline-flex h-12 items-center gap-3 rounded-[14px] border border-[rgba(53,231,90,0.22)] bg-[rgba(7,16,24,0.74)] px-4 text-sm font-bold text-[#F3F6F7]"
          >
            <CalendarDays size={17} className="text-[rgba(243,246,247,0.72)]" />
            {PERIOD_OPTIONS.find((o) => o.key === period)?.label}
            <ChevronDown size={16} className="text-[rgba(243,246,247,0.58)]" />
          </button>
          {periodOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-[200px] rounded-[12px] border border-white/[0.08] bg-[#07131c] p-1 shadow-lg">
              {PERIOD_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => { setPeriod(o.key); setPeriodOpen(false); }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    o.key === period ? "bg-[rgba(53,231,90,0.14)] text-[#35E75A]" : "text-[#F3F6F7] hover:bg-white/[0.05]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {CATEGORIES.map((cat) => {
        const rows = buckets[cat.key];
        const s = stats[cat.key];
        const isOpen = expanded.has(cat.key);
        return (
          <CategorySection
            key={cat.key}
            category={cat}
            rows={rows}
            stats={s}
            isOpen={isOpen}
            onToggle={() => toggle(cat.key)}
            search={search[cat.key]}
            setSearch={(v) => setSearch((prev) => ({ ...prev, [cat.key]: v }))}
          />
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CategorySection : summary card + collapsible details
// ────────────────────────────────────────────────────────────
function CategorySection({
  category, rows, stats, isOpen, onToggle, search, setSearch,
}: {
  category: Category;
  rows: Row[];
  stats: { won: number; lost: number; pending: number; settled: number; rate: number | null; total: number };
  isOpen: boolean;
  onToggle: () => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const acc = ACCENT_STYLES[category.accent];
  const rateColor = stats.rate == null ? "text-[rgba(243,246,247,0.55)]"
    : stats.rate >= 60 ? "text-[#35E75A]"
    : stats.rate >= 45 ? "text-[#D8AF3A]"
    : "text-[#E85B5B]";

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.league, r.country, r.home.name, r.away.name].join(" ").toLowerCase().includes(q));
  }, [rows, search]);

  const [visibleCount, setVisibleCount] = useState(10);
  const visible = filteredRows.slice(0, visibleCount);

  return (
    <section className={`overflow-hidden rounded-[22px] border ${acc.border} ${acc.bg}`}>
      {/* Summary header — toujours visible */}
      <div className="flex flex-wrap items-center gap-4 p-5">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${acc.ring}`}>
          {category.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-lg font-extrabold tracking-tight ${acc.text}`}>{category.title}</div>
          <div className="mt-0.5 text-xs text-fg-muted">{category.subtitle}</div>
        </div>
        <div className={`flex flex-col items-end ${rateColor}`}>
          <span className="text-2xl font-black leading-none">{stats.rate == null ? "—" : `${stats.rate}%`}</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.10em] text-[rgba(243,246,247,0.55)]">Réussite</span>
        </div>
      </div>

      {/* Compact stats strip */}
      <div className="grid grid-cols-4 gap-2 border-t border-white/[0.05] bg-black/20 px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.06em]">
        <StatCell label="Joués" value={String(stats.total)} tone="neutral" />
        <StatCell label="Gagnés" value={String(stats.won)} tone="good" />
        <StatCell label="Perdus" value={String(stats.lost)} tone="bad" />
        <StatCell label="En attente" value={String(stats.pending)} tone="muted" />
      </div>

      {/* Voir le détail button — PER CATEGORY */}
      {stats.total > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-12 w-full items-center justify-center gap-2 border-t border-white/[0.05] text-xs font-black uppercase tracking-wider ${acc.text} transition-colors hover:bg-white/[0.02]`}
        >
          {isOpen ? "Masquer le détail" : `Voir le détail (${stats.total})`}
          <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* Collapsible details */}
      {isOpen && stats.total > 0 && (
        <div className="border-t border-white/[0.05] bg-[rgba(5,12,18,0.42)]">
          <div className="p-4">
            <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-3">
              <Search size={15} className="text-fg-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer par équipe ou ligue…"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-fg outline-none placeholder:text-fg-muted/60"
              />
            </label>
          </div>

          {filteredRows.length === 0 ? (
            <div className="px-4 pb-6 text-center text-sm text-fg-muted">Aucun match ne correspond au filtre.</div>
          ) : (
            <div>
              {category.kind === "over25" ? (
                <Over25Table rows={visible as Over25Row[]} />
              ) : (
                <ResultTable rows={visible as ResultRow[]} accent={acc.text} />
              )}
              {visibleCount < filteredRows.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((v) => v + 10)}
                  className={`flex h-12 w-full items-center justify-center gap-2 border-t border-white/[0.05] text-xs font-black uppercase tracking-wider ${acc.text} hover:bg-white/[0.02]`}
                >
                  Voir plus ({filteredRows.length - visibleCount})
                  <ChevronDown size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StatCell({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "muted" | "neutral" }) {
  const cls = tone === "good" ? "text-[#35E75A]"
    : tone === "bad" ? "text-[#E85B5B]"
    : tone === "muted" ? "text-fg-muted"
    : "text-fg";
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">{label}</div>
      <div className={`mt-0.5 text-sm font-black ${cls}`}>{value}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Tables (unchanged from before)
// ────────────────────────────────────────────────────────────
function Over25Table({ rows }: { rows: Over25Row[] }) {
  return (
    <div>
      <TableHeader columns="lg:grid-cols-[120px_190px_minmax(0,1fr)_100px_110px_110px_110px]">
        <span>Date</span><span>Ligue</span><span>Match</span>
        <span>Sélection</span><span>Probabilité</span><span>Résultat</span><span>Statut</span>
      </TableHeader>
      {rows.map((item) => (
        <TableRow key={item.id} columns="lg:grid-cols-[120px_190px_minmax(0,1fr)_100px_110px_110px_110px]">
          <DateCell item={item} />
          <LeagueCell item={item} />
          <MatchCell item={item} />
          <SelectionBadge>+2.5</SelectionBadge>
          <span className="text-lg font-black text-[#35E75A]">{item.probability}%</span>
          <ResultScore score={item.finalScore} label={item.resultLabel} />
          <StatusBadge status={item.status} />
        </TableRow>
      ))}
    </div>
  );
}

function ResultTable({ rows, accent }: { rows: ResultRow[]; accent: string }) {
  return (
    <div>
      <TableHeader columns="lg:grid-cols-[120px_190px_minmax(0,1fr)_110px_110px_110px_110px]">
        <span>Date</span><span>Ligue</span><span>Match</span>
        <span>Avis</span><span>Confiance</span><span>Résultat</span><span>Statut</span>
      </TableHeader>
      {rows.map((item) => (
        <TableRow key={item.id} columns="lg:grid-cols-[120px_190px_minmax(0,1fr)_110px_110px_110px_110px]">
          <DateCell item={item} />
          <LeagueCell item={item} />
          <MatchCell item={item} />
          <ResultSelection item={item} accent={accent} />
          <span className={`text-lg font-black ${accent}`}>{item.confidence}%</span>
          <ResultScore score={item.finalScore} label={item.resultLabel} />
          <StatusBadge status={item.status} />
        </TableRow>
      ))}
    </div>
  );
}

function TableHeader({ columns, children }: { columns: string; children: ReactNode }) {
  return (
    <div className={`hidden min-w-0 items-center gap-3 border-b border-white/[0.06] bg-white/[0.025] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[rgba(243,246,247,0.62)] lg:grid ${columns}`}>
      {children}
    </div>
  );
}
function TableRow({ columns, children }: { columns: string; children: ReactNode }) {
  return (
    <div className={`grid min-h-[70px] min-w-0 grid-cols-1 gap-3 border-b border-white/[0.06] px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.03] lg:grid lg:items-center lg:gap-3 lg:py-0 ${columns}`}>
      {children}
    </div>
  );
}
function DateCell({ item }: { item: BaseRow }) {
  return (
    <div className="min-w-0 text-[#F3F6F7]">
      <div className="text-sm font-medium">{item.date}</div>
      <div className="mt-0.5 text-xs text-[rgba(243,246,247,0.55)]">{item.time}</div>
    </div>
  );
}
function LeagueCell({ item }: { item: BaseRow }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <CountryFlag country={item.country} league={item.league} flag={item.flag} className="h-[13px] w-[19px]" />
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-[#F3F6F7]">{item.league}</div>
        <div className="mt-0.5 truncate text-xs text-[rgba(243,246,247,0.45)]">{item.country}</div>
      </div>
    </div>
  );
}
function MatchCell({ item }: { item: BaseRow }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2">
      <TeamSide team={item.home} align="right" />
      <span className="text-center text-[10px] font-bold uppercase text-fg-muted">vs</span>
      <TeamSide team={item.away} align="left" />
    </div>
  );
}
function TeamSide({ team, align }: { team: Team; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {align === "right" && <span className="min-w-0 truncate text-right text-sm font-bold text-fg">{team.name}</span>}
      <TeamLogo team={team} />
      {align === "left" && <span className="min-w-0 truncate text-left text-sm font-bold text-fg">{team.name}</span>}
    </div>
  );
}
function TeamLogo({ team }: { team: Team }) {
  if (team.logo) return <img src={team.logo} alt={team.name} className="h-6 w-6 shrink-0 object-contain" />;
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.06] text-[9px] font-extrabold text-fg">
      {getTeamInitials(team.name)}
    </span>
  );
}
function SelectionBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 w-[70px] max-w-full items-center justify-center rounded-lg border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-base font-black text-[#35E75A]">
      {children}
    </span>
  );
}
function ResultSelection({ item, accent }: { item: ResultRow; accent: string }) {
  return (
    <div className="flex h-[46px] w-[80px] max-w-full flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-center">
      <div className={`text-lg font-black leading-none ${accent}`}>{item.selection}</div>
      <div className="mt-0.5 max-w-full truncate px-1 text-[10px] font-semibold text-fg-muted">{item.selectionLabel}</div>
    </div>
  );
}
function ResultScore({ score, label }: { score: string; label: string }) {
  return (
    <div className="min-w-0 text-[#F3F6F7]">
      <div className="text-center text-base font-bold leading-none">{score}</div>
      <div className="mt-0.5 truncate text-center text-xs text-fg-muted">{label}</div>
    </div>
  );
}
function StatusBadge({ status }: { status: Status }) {
  const config = {
    won:  { label: "Gagné", icon: <CheckCircle2 size={13} />, className: "border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.10)] text-[#35E75A]" },
    lost: { label: "Perdu", icon: <X size={13} />,             className: "border-[rgba(255,91,91,0.28)] bg-[rgba(255,91,91,0.08)] text-[#FF5E5E]" },
    pending: { label: "En attente", icon: <CalendarDays size={13} />, className: "border-white/[0.10] bg-white/[0.045] text-fg-muted" },
    void: { label: "Annulé", icon: <CalendarDays size={13} />, className: "border-white/[0.10] bg-white/[0.045] text-fg-muted" },
  }[status];
  return (
    <span className={`inline-flex h-7 w-[88px] max-w-full items-center justify-center gap-1.5 rounded-full border text-[11px] font-extrabold ${config.className}`}>
      {config.icon}{config.label}
    </span>
  );
}
function SmartBallIcon() {
  return (
    <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(53,231,90,0.38)] bg-[radial-gradient(circle_at_35%_30%,rgba(53,231,90,0.42),rgba(53,231,90,0.12)_58%,rgba(5,12,18,0.92)_100%)]">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-current" />
      <span className="absolute h-px w-6 bg-current opacity-70" />
      <span className="absolute h-6 w-px bg-current opacity-70" />
    </span>
  );
}
