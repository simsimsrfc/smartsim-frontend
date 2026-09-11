"use client";
import { useEffect, useState } from "react";
import { History, ChevronDown, Trash2, Check, X, Hourglass } from "lucide-react";

type LegPersisted = {
  fixture_id: string;
  home: string;
  away: string;
  league: string;
  market: string;
  prob: number;
  odd: number;
};

type BetPersisted = {
  kind: "single" | "combo";
  prob: number;
  odd: number;
  stake_pct: number;
  legs: LegPersisted[];
};

type Entry = {
  id: string;
  gestion_id: string;
  rank: number;
  title: string;
  played_at: string;
  bankroll_at_bet: number;
  currency: string;
  total_stake_pct: number;
  expected_return: number;
  ev: number;
  bets: BetPersisted[];
  // Local outcome tracking
  outcome?: "won" | "lost" | "pending";
  net_result?: number; // in currency units
};

function symbolFor(c: string) {
  return c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : ` ${c}`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  } catch { return iso.slice(0, 16); }
}

export function GestionHistory({
  userEmail, refreshTick, bankroll, currency,
}: {
  userEmail: string;
  refreshTick: number;
  bankroll: number;
  currency: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const key = `gestion-history:${userEmail}`;
    try {
      const raw = localStorage.getItem(key);
      setEntries(raw ? (JSON.parse(raw) as Entry[]) : []);
    } catch { setEntries([]); }
  }, [userEmail, refreshTick]);

  function persist(next: Entry[]) {
    setEntries(next);
    try { localStorage.setItem(`gestion-history:${userEmail}`, JSON.stringify(next)); } catch { /* silent */ }
  }

  function markOutcome(id: string, outcome: "won" | "lost" | "pending") {
    persist(entries.map((e) => {
      if (e.id !== id) return e;
      const totalStake = e.bankroll_at_bet * e.total_stake_pct;
      let net = 0;
      if (outcome === "won") {
        // "won" here = gestion overall net if all bets landed → approximation
        const grossReturn = e.bets.reduce((acc, b) =>
          acc + (b.stake_pct * b.odd), 0) * e.bankroll_at_bet;
        net = Math.round((grossReturn - totalStake) * 10) / 10;
      } else if (outcome === "lost") {
        net = -Math.round(totalStake * 10) / 10;
      }
      return { ...e, outcome, net_result: outcome === "pending" ? undefined : net };
    }));
  }

  function remove(id: string) {
    persist(entries.filter((e) => e.id !== id));
  }

  if (!entries.length) {
    return (
      <section className="rounded-2xl border border-white/[0.06] bg-[rgba(10,18,24,0.6)] p-4">
        <header className="mb-2 flex items-center gap-2">
          <History size={14} className="text-fg-muted" />
          <h3 className="text-sm font-bold text-fg">Historique de gestion</h3>
        </header>
        <p className="text-xs text-fg-muted">
          Aucune gestion enregistrée pour l'instant. Clique sur « J'ai joué cette gestion » ci-dessus pour tracker tes choix.
        </p>
      </section>
    );
  }

  // Aggregate stats
  const played = entries.length;
  const settled = entries.filter((e) => e.outcome === "won" || e.outcome === "lost");
  const won = entries.filter((e) => e.outcome === "won").length;
  const lost = entries.filter((e) => e.outcome === "lost").length;
  const pending = played - settled.length;
  const rate = settled.length ? Math.round((won / settled.length) * 100) : null;
  const netPnl = entries.reduce((acc, e) => acc + (e.net_result || 0), 0);
  const sym = symbolFor(currency);

  // Group by gestion.id for per-optique stats
  const byGestion = new Map<string, { title: string; played: number; won: number; lost: number; pnl: number }>();
  for (const e of entries) {
    const g = byGestion.get(e.gestion_id) || { title: e.title, played: 0, won: 0, lost: 0, pnl: 0 };
    g.played += 1;
    if (e.outcome === "won") g.won += 1;
    if (e.outcome === "lost") g.lost += 1;
    g.pnl += e.net_result || 0;
    byGestion.set(e.gestion_id, g);
  }
  const perOptique = [...byGestion.entries()]
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.played - a.played);

  const rows = showAll ? entries : entries.slice(0, 5);

  return (
    <section className="rounded-2xl border border-[rgba(123,92,255,0.20)] bg-[rgba(10,18,24,0.82)] p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7B5CFF]/20 text-[#B7A2FF]">
            <History size={14} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-fg">Historique de gestion</h3>
            <p className="text-[11px] text-fg-muted">Ce que tu as effectivement joué et leur résultat.</p>
          </div>
        </div>
      </header>

      {/* Aggregate cards */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell label="Gestions jouées" value={`${played}`} />
        <StatCell label="Réussite" value={rate == null ? "—" : `${rate}%`} tone={rate == null ? "muted" : rate >= 50 ? "good" : "bad"} />
        <StatCell label="Gagnées / Perdues" value={`${won} / ${lost}`} />
        <StatCell label="P&L net" value={netPnl === 0 ? `0${sym}` : `${netPnl > 0 ? "+" : ""}${netPnl}${sym}`} tone={netPnl > 0 ? "good" : netPnl < 0 ? "bad" : "muted"} />
      </div>

      {/* Per-optique breakdown */}
      {perOptique.length > 1 && (
        <div className="mb-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-fg-muted">Par optique</div>
          <ul className="space-y-1.5">
            {perOptique.map((g) => (
              <li key={g.id} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-semibold text-fg">{g.title}</span>
                <span className="text-fg-muted">{g.played} jouée{g.played > 1 ? "s" : ""}</span>
                <span className="text-[#35E75A]">✓{g.won}</span>
                <span className="text-[#E85B5B]">✗{g.lost}</span>
                <span className={`w-16 text-right font-bold ${g.pnl > 0 ? "text-[#35E75A]" : g.pnl < 0 ? "text-[#E85B5B]" : "text-fg-muted"}`}>
                  {g.pnl === 0 ? `0${sym}` : `${g.pnl > 0 ? "+" : ""}${g.pnl}${sym}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Entry list */}
      <ul className="space-y-2">
        {rows.map((e) => (
          <li key={e.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="text-[10px] font-bold text-fg-muted">{fmtDate(e.played_at)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-fg">Gestion #{e.rank} — {e.title}</div>
                <div className="text-[10px] text-fg-muted">
                  {e.bets.length} paris · {(e.total_stake_pct * 100).toFixed(1)}% BR · ev {(e.ev * 100).toFixed(1)}%
                </div>
              </div>
              <OutcomeSwitch outcome={e.outcome || "pending"} onChange={(o) => markOutcome(e.id, o)} />
              {e.net_result != null && (
                <span className={`w-16 text-right text-xs font-black ${e.net_result >= 0 ? "text-[#35E75A]" : "text-[#E85B5B]"}`}>
                  {e.net_result > 0 ? "+" : ""}{e.net_result}{symbolFor(e.currency)}
                </span>
              )}
              <button
                onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                className="rounded-full p-1 text-fg-muted hover:text-fg"
                aria-label="Détails"
              >
                <ChevronDown size={14} className={`transition-transform ${expandedId === e.id ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => remove(e.id)}
                className="rounded-full p-1 text-fg-muted hover:text-[#E85B5B]"
                aria-label="Supprimer"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {expandedId === e.id && (
              <div className="border-t border-white/[0.05] px-3 py-2">
                <ul className="space-y-1.5 text-xs">
                  {e.bets.map((b, i) => (
                    <li key={i} className="rounded border border-white/[0.05] bg-black/20 px-2 py-1.5">
                      <div className="mb-0.5 flex items-center gap-2 text-[11px]">
                        <span className={`font-black uppercase tracking-wider ${b.kind === "single" ? "text-[#35E75A]" : "text-[#F5C542]"}`}>
                          {b.kind === "single" ? "Simple" : `Combo ×${b.legs.length}`}
                        </span>
                        <span className="text-fg-muted">cote {b.odd.toFixed(2)} · {(b.stake_pct * 100).toFixed(1)}% BR</span>
                      </div>
                      {b.legs.map((l) => (
                        <div key={l.fixture_id} className="truncate text-fg-muted">
                          · {l.home} — {l.away} <span className="text-fg">({l.market} @ {l.odd.toFixed(2)})</span>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      {entries.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-white/[0.08] text-xs font-black uppercase tracking-wider text-fg-muted hover:text-fg"
        >
          Voir plus ({entries.length - 5})
        </button>
      )}
    </section>
  );
}

function StatCell({ label, value, tone = "muted" }: { label: string; value: string; tone?: "good" | "bad" | "muted" }) {
  const cls = tone === "good"
    ? "text-[#35E75A]"
    : tone === "bad"
      ? "text-[#E85B5B]"
      : "text-fg";
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center">
      <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">{label}</div>
      <div className={`mt-0.5 text-sm font-black ${cls}`}>{value}</div>
    </div>
  );
}

function OutcomeSwitch({
  outcome, onChange,
}: {
  outcome: "won" | "lost" | "pending";
  onChange: (o: "won" | "lost" | "pending") => void;
}) {
  const items: Array<{ key: "won" | "lost" | "pending"; icon: React.ReactNode; tone: string }> = [
    { key: "won",     icon: <Check size={10} />,     tone: "text-[#35E75A] hover:bg-[#35E75A]/10" },
    { key: "pending", icon: <Hourglass size={10} />, tone: "text-fg-muted hover:bg-white/[0.05]" },
    { key: "lost",    icon: <X size={10} />,         tone: "text-[#E85B5B] hover:bg-[#E85B5B]/10" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-black/20 p-0.5">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
            outcome === it.key ? "bg-white/[0.10]" : ""
          } ${it.tone}`}
          aria-label={it.key}
          title={it.key === "won" ? "Gagnée" : it.key === "lost" ? "Perdue" : "En attente"}
        >
          {it.icon}
        </button>
      ))}
    </div>
  );
}
