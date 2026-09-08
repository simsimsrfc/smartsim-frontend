"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Search,
  Trophy,
  X,
} from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { HistoryApiItem } from "@/lib/api";

type HistoryTab = "over25" | "smartResult" | "result";
type Status = "won" | "lost" | "pending" | "void";
type ResultCode = "1" | "N" | "2" | "1N" | "N2" | "12";

type Team = {
  name: string;
  logo: string;
};

type BaseHistoryItem = {
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

type Over25Item = BaseHistoryItem & {
  kind: "over25";
  probability: number;
  goals: number;
};

type SmartResultItem = BaseHistoryItem & {
  kind: "smartResult";
  selection: ResultCode;
  confidence: number;
  selectionLabel: string;
};

type ResultItem = BaseHistoryItem & {
  kind: "result";
  type: "Smart Sim" | "Avis simple" | "Hors Smart Sim";
  selection: ResultCode;
  confidence: number;
  selectionLabel: string;
};

const TABS: Array<{
  id: HistoryTab;
  title: string;
  subtitle: string;
  icon: ReactNode;
}> = [
  {
    id: "over25",
    title: "Smart Sim +2,5",
    subtitle: "Historique des sélections +2,5 buts",
    icon: <SmartBallIcon />,
  },
  {
    id: "smartResult",
    title: "Smart Sim Résultat",
    subtitle: "Historique des sélections résultat Smart Sim",
    icon: <Trophy size={28} />,
  },
  {
    id: "result",
    title: "Résultat match",
    subtitle: "Historique de tous les avis résultat",
    icon: <Trophy size={28} />,
  },
];

const TABLE_META: Record<HistoryTab, { title: string; subtitle: string; icon: ReactNode }> = {
  over25: {
    title: "Historique Smart Sim +2,5",
    subtitle: "Les matchs recommandés +2,5 buts",
    icon: <SmartBallIcon />,
  },
  smartResult: {
    title: "Historique Smart Sim Résultat",
    subtitle: "Les sélections résultat les plus fortes",
    icon: <Trophy size={26} />,
  },
  result: {
    title: "Historique Résultat match",
    subtitle: "Tous les avis enregistrés sur le résultat du match",
    icon: <Trophy size={26} />,
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value.slice(0, 10);
  }
}

function formatTime(value: string): string {
  if (!value) return "--:--";
  try {
    return new Date(value).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

function percent(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

function mapBase(item: HistoryApiItem): BaseHistoryItem {
  return {
    id: `${item.type}:${item.fixture_id}`,
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

function mapOver25(item: HistoryApiItem): Over25Item {
  const totalGoals = (item.score.home ?? 0) + (item.score.away ?? 0);
  return {
    ...mapBase(item),
    kind: "over25",
    probability: percent(item.selection.probability),
    goals: totalGoals,
    resultLabel: item.goals_label || `${totalGoals} buts`,
  };
}

function mapResult(item: HistoryApiItem): ResultItem {
  return {
    ...mapBase(item),
    kind: "result",
    type: "Avis simple",
    selection: (item.selection.pick || "1") as ResultCode,
    selectionLabel: item.selection.label || "Avis résultat",
    confidence: percent(item.selection.probability),
  };
}

export function HistoryClient({ items }: { items: HistoryApiItem[] }) {
  const [activeTab, setActiveTab] = useState<HistoryTab>("over25");
  const [search, setSearch] = useState("");
  const historyData = useMemo(() => ({
    over25: items.filter((item) => item.type === "smart-over25").map(mapOver25),
    smartResult: items.filter((item) => item.type === "smart-result").map((item) => ({
      ...mapBase(item),
      kind: "smartResult" as const,
      selection: (item.selection.pick || "1") as ResultCode,
      selectionLabel: item.selection.label || "Avis résultat",
      confidence: percent(item.selection.probability),
    })),
    result: items.filter((item) => item.type === "result").map(mapResult),
  }), [items]);

  const rows = useMemo(() => {
    const source =
      activeTab === "over25"
        ? historyData.over25
        : activeTab === "smartResult"
          ? historyData.smartResult
          : historyData.result;

    const query = search.trim().toLowerCase();
    if (!query) return source;

    return source.filter((item) =>
      [item.league, item.country, item.home.name, item.away.name]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [activeTab, historyData, search]);

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#F3F6F7] md:text-5xl">
            Historique
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[rgba(243,246,247,0.72)]">
            Retrouvez l'historique complet de vos sélections et avis passés.
          </p>
        </div>
        <button className="inline-flex h-12 items-center gap-3 rounded-[14px] border border-[rgba(53,231,90,0.22)] bg-[rgba(7,16,24,0.74)] px-4 text-sm font-bold text-[#F3F6F7]">
          <CalendarDays size={17} className="text-[rgba(243,246,247,0.72)]" />
          7 derniers jours
          <ChevronDown size={16} className="text-[rgba(243,246,247,0.58)]" />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group flex min-h-[116px] items-center gap-5 rounded-[18px] border p-5 text-left transition-all ${
                active
                  ? "border-[rgba(53,231,90,0.45)] bg-[radial-gradient(circle_at_left,rgba(53,231,90,0.18),transparent_42%),rgba(7,16,24,0.86)] shadow-[0_18px_48px_rgba(53,231,90,0.08)]"
                  : "border-white/[0.08] bg-[rgba(7,16,24,0.72)] hover:border-[rgba(53,231,90,0.24)]"
              }`}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  active
                    ? "border-[rgba(53,231,90,0.28)] bg-[rgba(53,231,90,0.13)] text-[#35E75A]"
                    : "border-white/[0.10] bg-white/[0.04] text-[rgba(243,246,247,0.72)] group-hover:text-[#35E75A]"
                }`}
              >
                {tab.icon}
              </span>
              <span className="min-w-0">
                <span className={`block text-xl font-extrabold tracking-[-0.03em] ${active ? "text-[#F3F6F7]" : "text-[rgba(243,246,247,0.86)]"}`}>
                  {tab.title}
                </span>
                <span className="mt-2 block text-sm leading-snug text-[rgba(243,246,247,0.62)]">{tab.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button className="inline-flex h-12 w-full items-center justify-between rounded-[14px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-4 text-sm font-semibold text-[#F3F6F7] sm:w-[320px]">
          <span className="inline-flex items-center gap-3">
            <CalendarDays size={17} className="text-[rgba(243,246,247,0.62)]" />
            Toutes les dates
          </span>
          <ChevronDown size={16} className="text-[rgba(243,246,247,0.58)]" />
        </button>

        <label className="flex h-12 w-full items-center gap-3 rounded-[14px] border border-white/[0.08] bg-[rgba(7,16,24,0.72)] px-4 lg:max-w-[470px]">
          <Search size={19} className="text-[rgba(243,246,247,0.62)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un match, une équipe..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#F3F6F7] outline-none placeholder:text-[rgba(243,246,247,0.38)]"
          />
        </label>
      </div>

      <HistoryTable activeTab={activeTab} rows={rows} />
    </div>
  );
}

function HistoryTable({
  activeTab,
  rows,
}: {
  activeTab: HistoryTab;
  rows: Array<Over25Item | SmartResultItem | ResultItem>;
}) {
  const meta = TABLE_META[activeTab];
  const [visibleCount, setVisibleCount] = useState(10);
  const visibleRows = rows.slice(0, visibleCount);

  return (
    <section className="min-w-0 w-full max-w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[rgba(7,16,24,0.82)] shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
      <div className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-5 md:px-7">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.10)] text-[#35E75A] shadow-[0_0_28px_rgba(53,231,90,0.10)]">
          {meta.icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-[#F3F6F7]">{meta.title}</h2>
          <p className="mt-1 text-sm text-[rgba(243,246,247,0.62)]">{meta.subtitle}</p>
        </div>
      </div>

      {activeTab === "over25" && <Over25Table rows={visibleRows as Over25Item[]} />}
      {activeTab === "smartResult" && <SmartResultTable rows={visibleRows as SmartResultItem[]} />}
      {activeTab === "result" && <ResultOpinionTable rows={visibleRows as ResultItem[]} />}

      {visibleCount < rows.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((value) => value + 10)}
          className="flex h-16 w-full items-center justify-center gap-3 border-t border-white/[0.06] text-base font-extrabold text-[#35E75A] outline-none transition-colors hover:bg-[rgba(53,231,90,0.04)] focus-visible:ring-2 focus-visible:ring-[#35E75A]/30"
        >
          Voir plus ({rows.length - visibleCount})
          <ChevronDown size={18} />
        </button>
      )}
    </section>
  );
}

function Over25Table({ rows }: { rows: Over25Item[] }) {
  if (rows.length === 0) return <EmptyState />;

  return (
    <div>
      <TableHeader columns="lg:grid-cols-[120px_190px_minmax(0,1fr)_100px_110px_110px_110px]">
        <span>Date</span>
        <span>Ligue</span>
        <span>Match</span>
        <span>Sélection</span>
        <span>Probabilité</span>
        <span>Résultat</span>
        <span>Statut</span>
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

function SmartResultTable({ rows }: { rows: SmartResultItem[] }) {
  if (rows.length === 0) return <EmptyState />;

  return (
    <div>
      <TableHeader columns="lg:grid-cols-[120px_190px_minmax(0,1fr)_100px_110px_110px_110px]">
        <span>Date</span>
        <span>Ligue</span>
        <span>Match</span>
        <span>Sélection</span>
        <span>Confiance</span>
        <span>Résultat</span>
        <span>Statut</span>
      </TableHeader>
      {rows.map((item) => (
        <TableRow key={item.id} columns="lg:grid-cols-[120px_190px_minmax(0,1fr)_100px_110px_110px_110px]">
          <DateCell item={item} />
          <LeagueCell item={item} />
          <MatchCell item={item} />
          <ResultSelection item={item} />
          <span className="text-lg font-black text-[#35E75A]">{item.confidence}%</span>
          <ResultScore score={item.finalScore} label={item.resultLabel} />
          <StatusBadge status={item.status} />
        </TableRow>
      ))}
    </div>
  );
}

function ResultOpinionTable({ rows }: { rows: ResultItem[] }) {
  if (rows.length === 0) return <EmptyState />;

  return (
    <div>
      <TableHeader columns="lg:grid-cols-[105px_170px_minmax(0,1fr)_90px_90px_90px_100px_96px]">
        <span>Date</span>
        <span>Ligue</span>
        <span>Match</span>
        <span>Type</span>
        <span>Avis</span>
        <span>Confiance</span>
        <span>Résultat</span>
        <span>Statut</span>
      </TableHeader>
      {rows.map((item) => (
        <TableRow key={item.id} columns="lg:grid-cols-[105px_170px_minmax(0,1fr)_90px_90px_90px_100px_96px]">
          <DateCell item={item} />
          <LeagueCell item={item} />
          <MatchCell item={item} />
          <TypeBadge type={item.type} />
          <ResultSelection item={item} compact />
          <span className="text-lg font-black text-[#35E75A]">{item.confidence}%</span>
          <ResultScore score={item.finalScore} label={item.resultLabel} compact />
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
    <div className={`grid min-h-[78px] min-w-0 grid-cols-1 gap-4 border-b border-white/[0.06] px-4 py-4 transition-colors last:border-b-0 hover:bg-[rgba(53,231,90,0.04)] lg:grid lg:items-center lg:gap-3 lg:py-0 ${columns}`}>
      {children}
    </div>
  );
}

function DateCell({ item }: { item: BaseHistoryItem }) {
  return (
    <div className="min-w-0 font-medium text-[#F3F6F7]">
      <div className="text-sm">{item.date}</div>
      <div className="mt-1 text-sm text-[rgba(243,246,247,0.66)]">{item.time}</div>
    </div>
  );
}

function LeagueCell({ item }: { item: BaseHistoryItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CountryFlag country={item.country} league={item.league} flag={item.flag} className="h-[15px] w-[22px]" />
      <div className="min-w-0">
        <div className="truncate text-sm font-extrabold text-[#F3F6F7]">{item.league}</div>
        <div className="mt-1 truncate text-xs text-[rgba(243,246,247,0.48)]">{item.country}</div>
      </div>
    </div>
  );
}

function MatchCell({ item }: { item: BaseHistoryItem }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] items-center gap-2">
      <TeamSide team={item.home} align="right" />
      <span className="text-center text-xs font-bold uppercase text-[rgba(243,246,247,0.45)]">vs</span>
      <TeamSide team={item.away} align="left" />
    </div>
  );
}

function TeamSide({ team, align }: { team: Team; align: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {align === "right" && <span className="min-w-0 truncate text-right text-sm font-bold text-[#F3F6F7]">{team.name}</span>}
      <TeamLogo team={team} />
      {align === "left" && <span className="min-w-0 truncate text-left text-sm font-bold text-[#F3F6F7]">{team.name}</span>}
    </div>
  );
}

function TeamLogo({ team }: { team: Team }) {
  if (team.logo) {
    return <img src={team.logo} alt={team.name} className="h-7 w-7 shrink-0 object-contain" />;
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.06] text-[10px] font-extrabold text-[rgba(243,246,247,0.88)]">
      {getTeamInitials(team.name)}
    </span>
  );
}

function SelectionBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-9 w-[78px] max-w-full items-center justify-center rounded-[10px] border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-lg font-black text-[#35E75A]">
      {children}
    </span>
  );
}

function ResultSelection({ item, compact = false }: { item: SmartResultItem | ResultItem; compact?: boolean }) {
  return (
    <div className={`${compact ? "h-[52px] w-[88px]" : "h-[52px] w-[78px]"} flex max-w-full flex-col items-center justify-center rounded-[10px] border border-[rgba(53,231,90,0.20)] bg-[rgba(53,231,90,0.09)] text-center`}>
      <div className="text-xl font-black leading-none text-[#35E75A]">{item.selection}</div>
      <div className="mt-1 max-w-full truncate px-1 text-[11px] font-semibold text-[#DFFFE8]">{item.selectionLabel}</div>
    </div>
  );
}

function ResultScore({ score, label, compact = false }: { score: string; label: string; compact?: boolean }) {
  return (
    <div className="min-w-0 text-[#F3F6F7]">
      <div className={`${compact ? "text-base" : "text-lg"} text-center font-bold leading-none`}>{score}</div>
      <div className="mt-1 truncate text-center text-xs text-[rgba(243,246,247,0.66)]">{label}</div>
    </div>
  );
}

function TypeBadge({ type }: { type: ResultItem["type"] }) {
  const smart = type === "Smart Sim";
  return (
    <span
      className={`inline-flex h-8 max-w-[88px] items-center justify-center rounded-[9px] px-2 text-[11px] font-bold ${
        smart
          ? "border border-[rgba(53,231,90,0.18)] bg-[rgba(53,231,90,0.09)] text-[#35E75A]"
          : "border border-white/[0.08] bg-white/[0.055] text-[rgba(243,246,247,0.76)]"
      }`}
    >
      <span className="truncate">{type}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const config = {
    won: {
      label: "Gagné",
      icon: <CheckCircle2 size={15} />,
      className: "border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.10)] text-[#35E75A]",
    },
    lost: {
      label: "Perdu",
      icon: <X size={15} />,
      className: "border-[rgba(255,91,91,0.28)] bg-[rgba(255,91,91,0.08)] text-[#FF5E5E]",
    },
    pending: {
      label: "En attente",
      icon: <CalendarDays size={15} />,
      className: "border-white/[0.10] bg-white/[0.045] text-[rgba(243,246,247,0.70)]",
    },
    void: {
      label: "Annulé",
      icon: <CalendarDays size={15} />,
      className: "border-white/[0.10] bg-white/[0.045] text-[rgba(243,246,247,0.70)]",
    },
  }[status];

  return (
    <span className={`inline-flex h-9 w-[94px] max-w-full items-center justify-center gap-1.5 rounded-full border text-xs font-extrabold ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-10 text-center">
      <div className="text-base font-extrabold text-[#F3F6F7]">Aucun historique pour le moment</div>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-[rgba(243,246,247,0.58)]">
        Les sélections évaluées apparaîtront ici lorsque les prochains matchs seront terminés.
      </p>
    </div>
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
