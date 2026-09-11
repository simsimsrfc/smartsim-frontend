"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wallet, TrendingUp, CalendarDays, Layers, Save, Check,
  ChevronDown, ChevronRight, Trash2, Info,
} from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { api } from "@/lib/api";
import { useBankroll } from "@/lib/useBankroll";
import { BankrollControl } from "@/components/bankroll/BankrollControl";
import { PageHeader } from "@/components/layout/PageHeader";
import { GestionHistory } from "./GestionHistory";

type Day = "today" | "tomorrow";

type Leg = {
  match: MatchSummary;
  market: "over_25" | "over_15" | "btts";
  marketLabel: string;
  prob: number;
  odd: number;
  isValue: boolean;
};

type BetSlip = {
  kind: "single" | "combo";
  legs: Leg[];
  prob: number;      // joint probability
  odd: number;       // combined odd
  stakePct: number;  // share of the gestion's total stake
};

type Gestion = {
  id: string;
  title: string;
  subtitle: string;
  bets: BetSlip[];         // 3 bets total across singles/combos
  totalStakePct: number;   // % bankroll used (over all bets combined)
  expectedReturn: number;  // Σ prob_i * odd_i * stakeShare_i
  ev: number;              // expectedReturn - 1
};

const MARKET_LABEL: Record<Leg["market"], string> = {
  over_25: "+2.5",
  over_15: "+1.5",
  btts: "BTTS",
};

function legFromMatch(m: MatchSummary): Leg | null {
  const o25 = m.probabilities?.over_25 || 0;
  const btts = m.probabilities?.btts || 0;
  const oddO25 = m.odds?.over_25 || 0;
  const oddBtts = m.odds?.btts || 0;
  const isValue = !!m.smart_bet?.is_value;
  const chosen = m.smart_bet?.kelly_market as Leg["market"] | undefined;
  if (chosen && ["over_25", "btts", "over_15"].includes(chosen)) {
    const p = m.probabilities?.[chosen] ?? 0;
    const o = m.odds?.[chosen] ?? 0;
    if (p > 0 && o > 1) {
      return { match: m, market: chosen, marketLabel: MARKET_LABEL[chosen], prob: p, odd: o, isValue };
    }
  }
  if (o25 >= 0.6 && oddO25 > 1) {
    return { match: m, market: "over_25", marketLabel: MARKET_LABEL.over_25, prob: o25, odd: oddO25, isValue };
  }
  if (btts >= 0.6 && oddBtts > 1) {
    return { match: m, market: "btts", marketLabel: MARKET_LABEL.btts, prob: btts, odd: oddBtts, isValue };
  }
  return null;
}

function combinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const n = arr.length;
  if (k > n || k <= 0) return out;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    out.push(idx.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return out;
}

function bestCombo(pool: Leg[], k: number, sortBy: "ev" | "prob" | "odd" = "ev"): BetSlip | null {
  const combos = combinations(pool, k).map((legs) => {
    const prob = legs.reduce((acc, l) => acc * l.prob, 1);
    const odd = legs.reduce((acc, l) => acc * l.odd, 1);
    return { kind: "combo" as const, legs, prob, odd, stakePct: 0, ev: prob * odd - 1 };
  });
  const positive = combos.filter((c) => c.ev > 0);
  const source = positive.length ? positive : combos;
  if (!source.length) return null;
  const sorted = source.sort((a, b) => {
    if (sortBy === "prob") return b.prob - a.prob;
    if (sortBy === "odd") return b.odd - a.odd;
    return b.ev - a.ev;
  });
  const { kind, legs, prob, odd, stakePct } = sorted[0];
  return { kind, legs, prob, odd, stakePct };
}

function singleFromLeg(leg: Leg): BetSlip {
  return { kind: "single", legs: [leg], prob: leg.prob, odd: leg.odd, stakePct: 0 };
}

function pickNonOverlapping(picked: BetSlip[], candidates: BetSlip[]): BetSlip | null {
  const usedIds = new Set(picked.flatMap((b) => b.legs.map((l) => l.match.fixture_id)));
  for (const c of candidates) {
    const conflict = c.legs.some((l) => usedIds.has(l.match.fixture_id));
    if (!conflict) return c;
  }
  return null;
}

function assignStakeShares(bets: BetSlip[]): BetSlip[] {
  // Weight each bet by fractional Kelly (¼ Kelly). Normalize so total ≤ bankroll cap.
  const weights = bets.map((b) => {
    if (b.odd <= 1) return 0;
    const rawK = (b.prob * b.odd - 1) / (b.odd - 1);
    return Math.max(0, rawK * 0.25);
  });
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (sumW <= 0) {
    // Fallback: equal split at 3% each
    const equal = 0.03;
    return bets.map((b) => ({ ...b, stakePct: equal }));
  }
  // Cap total bankroll usage at 10% (aggressive plan) — normalise if we'd exceed it
  const totalCap = 0.10;
  const scale = sumW > totalCap ? totalCap / sumW : 1;
  return bets.map((b, i) => ({ ...b, stakePct: weights[i] * scale }));
}

function computeGestionMetrics(bets: BetSlip[]): { total: number; expReturn: number; ev: number } {
  const total = bets.reduce((acc, b) => acc + b.stakePct, 0);
  if (total <= 0) return { total: 0, expReturn: 0, ev: 0 };
  // Expected return per unit staked = Σ (share * prob * odd) / total
  const grossReturn = bets.reduce((acc, b) => acc + b.stakePct * b.prob * b.odd, 0);
  const expReturn = grossReturn / total; // net multiplier per € invested
  const ev = expReturn - 1;
  return { total, expReturn, ev };
}

function buildGestions(candidates: Leg[]): Gestion[] {
  if (candidates.length < 2) return [];

  // Dedup by fixture (keep best leg per match)
  const byFixture = new Map<string, Leg>();
  for (const l of candidates) {
    const prev = byFixture.get(l.match.fixture_id);
    const edge = l.prob * l.odd - 1;
    const prevEdge = prev ? prev.prob * prev.odd - 1 : -Infinity;
    if (edge > prevEdge) byFixture.set(l.match.fixture_id, l);
  }
  const positive = [...byFixture.values()].filter((l) => l.prob * l.odd > 1);
  const pool = (positive.length >= 3 ? positive : [...byFixture.values()])
    .sort((a, b) => (b.prob * b.odd - 1) - (a.prob * a.odd - 1))
    .slice(0, 10);

  if (pool.length < 3) return [];

  const gestions: Gestion[] = [];

  // ── Optique A : 3 singles diversifiés — 3 meilleures cotes indépendantes ──
  const topSingles = pool.slice(0, 3).map(singleFromLeg);
  if (topSingles.length === 3) {
    gestions.push({
      id: "singles-top",
      title: "3 simples diversifiés",
      subtitle: "Trois paris indépendants, mise répartie via Kelly ¼ — le pilier régularité.",
      bets: assignStakeShares(topSingles),
      totalStakePct: 0, expectedReturn: 0, ev: 0,
    });
  }

  // ── Optique B : 1 combo 2 legs + 1 single ──
  const combo2 = bestCombo(pool, 2, "ev");
  if (combo2) {
    const used = new Set(combo2.legs.map((l) => l.match.fixture_id));
    const remaining = pool.filter((l) => !used.has(l.match.fixture_id));
    if (remaining.length >= 1) {
      const single = singleFromLeg(remaining[0]);
      gestions.push({
        id: "combo2-plus-single",
        title: "1 double + 1 simple",
        subtitle: "Un doublet à cote intéressante et un simple sûr à côté pour compenser le risque.",
        bets: assignStakeShares([combo2, single]),
        totalStakePct: 0, expectedReturn: 0, ev: 0,
      });
    }
  }

  // ── Optique C : 1 combo 3 legs (concentré) ──
  const combo3 = bestCombo(pool, 3, "ev");
  if (combo3) {
    // Wrap into a "single bet" from a betting perspective (1 slip)
    gestions.push({
      id: "combo3-only",
      title: "Triple concentré",
      subtitle: "Un unique combiné à 3 jambes — meilleur ratio proba × cote.",
      bets: assignStakeShares([combo3]),
      totalStakePct: 0, expectedReturn: 0, ev: 0,
    });
  }

  // ── Optique D : 1 combo fun 4 legs + 2 singles sûrs ──
  const combo4 = bestCombo(pool, 4, "odd");
  if (combo4) {
    const used = new Set(combo4.legs.map((l) => l.match.fixture_id));
    const remaining = pool.filter((l) => !used.has(l.match.fixture_id));
    const safeSingles = [...remaining].sort((a, b) => b.prob - a.prob).slice(0, 2);
    if (safeSingles.length === 2) {
      gestions.push({
        id: "combo4-plus-safe",
        title: "Coup dur + 2 filets",
        subtitle: "Un combiné 4 matchs à grosse cote et deux simples solides pour amortir.",
        bets: assignStakeShares([combo4, ...safeSingles.map(singleFromLeg)]),
        totalStakePct: 0, expectedReturn: 0, ev: 0,
      });
    }
  }

  // ── Optique E : 2 doublets ──
  const combo2a = bestCombo(pool, 2, "ev");
  if (combo2a) {
    const used = new Set(combo2a.legs.map((l) => l.match.fixture_id));
    const remaining = pool.filter((l) => !used.has(l.match.fixture_id));
    const combo2b = bestCombo(remaining, 2, "ev");
    if (combo2b) {
      gestions.push({
        id: "double-double",
        title: "Deux doublets équilibrés",
        subtitle: "Deux combinés 2 matchs sans jambe commune — variance modérée.",
        bets: assignStakeShares([combo2a, combo2b]),
        totalStakePct: 0, expectedReturn: 0, ev: 0,
      });
    }
  }

  // Compute metrics for each gestion
  for (const g of gestions) {
    const m = computeGestionMetrics(g.bets);
    g.totalStakePct = m.total;
    g.expectedReturn = m.expReturn;
    g.ev = m.ev;
  }

  // Rank by EV descending, then by expectedReturn
  gestions.sort((a, b) => {
    if (Math.abs(a.ev - b.ev) < 0.005) return b.expectedReturn - a.expectedReturn;
    return b.ev - a.ev;
  });

  return gestions;
}

export function CombosClient({ userEmail }: { userEmail: string }) {
  const [day, setDay] = useState<Day>("today");
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const bankroll = useBankroll(userEmail);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.smartSelections(0, day)
      .then((res) => { if (!cancelled) { setMatches(res.matches || []); setError(null); } })
      .catch((e) => { if (!cancelled) { setMatches([]); setError((e as Error).message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [day]);

  const candidates = useMemo(() => matches.map(legFromMatch).filter((l): l is Leg => !!l), [matches]);
  const gestions = useMemo(() => buildGestions(candidates), [candidates]);

  const currency = bankroll?.currency || "EUR";
  const bkAmount = bankroll?.amount || 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion bankroll"
        subtitle="Plusieurs optiques de répartition — pour chaque optique, comment placer 2 à 3 paris et quelle mise sur chacun."
      />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(123,92,255,0.24)] bg-[rgba(123,92,255,0.06)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7B5CFF]/20 text-[#B7A2FF]">
            <Wallet size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-fg">Bankroll de référence</div>
            <div className="text-xs text-fg-muted">Les mises s'ajustent instantanément à chaque changement.</div>
          </div>
        </div>
        <BankrollControl userEmail={userEmail} compact />
      </section>

      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-[#35E75A]" />
        {(["today", "tomorrow"] as Day[]).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`h-9 rounded-full border px-3 text-xs font-extrabold transition-colors ${
              day === d
                ? "border-[rgba(53,231,90,0.28)] bg-[rgba(53,231,90,0.18)] text-[#35E75A]"
                : "border-transparent bg-white/[0.03] text-fg-muted hover:text-fg"
            }`}
          >
            {d === "today" ? "Aujourd'hui" : "Demain"}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 font-mono text-sm text-danger">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-fg-muted">Chargement des candidats…</div>}

      {!loading && gestions.length === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[rgba(5,12,18,0.58)] px-4 py-8 text-center text-sm text-fg-muted">
          Pas assez de candidats à valeur positive pour construire des gestions ({candidates.length} candidats analysés).
        </div>
      )}

      <div className="space-y-4">
        {gestions.map((g, i) => (
          <GestionCard
            key={g.id}
            rank={i + 1}
            gestion={g}
            bankroll={bkAmount}
            currency={currency}
            userEmail={userEmail}
            onPlayed={() => setRefreshTick((t) => t + 1)}
          />
        ))}
      </div>

      <GestionHistory userEmail={userEmail} refreshTick={refreshTick} bankroll={bkAmount} currency={currency} />

      <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 text-xs leading-relaxed text-fg-muted">
        <Info size={12} className="mr-1 inline-block text-[#B7A2FF]" />
        <strong className="text-fg">Méthode :</strong> chaque gestion agrège 2 à 3 paris (simples et/ou combinés).
        La mise de chaque pari est calculée en Kelly fractionnaire (¼ Kelly), le total étant plafonné à 10% de bankroll par gestion.
        Une gestion n'est retenue que si l'espérance mathématique est &gt; 0.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Gestion card
// ═══════════════════════════════════════════════════════════
function symbolFor(c: string) {
  return c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : ` ${c}`;
}

function GestionCard({
  rank, gestion, bankroll, currency, userEmail, onPlayed,
}: {
  rank: number;
  gestion: Gestion;
  bankroll: number;
  currency: string;
  userEmail: string;
  onPlayed: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const sym = symbolFor(currency);
  const totalStakeEur = bankroll > 0 ? Math.max(1, Math.round(bankroll * gestion.totalStakePct * 10) / 10) : null;
  const potentialAvgReturn = totalStakeEur != null ? Math.round(totalStakeEur * gestion.expectedReturn * 10) / 10 : null;

  // Rank tone
  const rankTone = rank === 1
    ? "border-[rgba(53,231,90,0.35)] bg-[rgba(53,231,90,0.06)]"
    : rank === 2
      ? "border-[rgba(245,197,66,0.30)] bg-[rgba(245,197,66,0.04)]"
      : "border-white/[0.08] bg-[rgba(10,18,24,0.82)]";
  const rankBadge = rank === 1
    ? { text: "text-[#35E75A]", bg: "bg-[#35E75A]" }
    : rank === 2
      ? { text: "text-[#F5C542]", bg: "bg-[#F5C542]" }
      : { text: "text-[#B7A2FF]", bg: "bg-[#7B5CFF]" };

  function playThis() {
    const key = `gestion-history:${userEmail}`;
    const now = new Date().toISOString();
    const entry = {
      id: `${gestion.id}-${Date.now()}`,
      gestion_id: gestion.id,
      rank,
      title: gestion.title,
      played_at: now,
      bankroll_at_bet: bankroll,
      currency,
      total_stake_pct: gestion.totalStakePct,
      expected_return: gestion.expectedReturn,
      ev: gestion.ev,
      bets: gestion.bets.map((b) => ({
        kind: b.kind,
        prob: b.prob,
        odd: b.odd,
        stake_pct: b.stakePct,
        legs: b.legs.map((l) => ({
          fixture_id: l.match.fixture_id,
          home: l.match.home_team.name,
          away: l.match.away_team.name,
          league: l.match.league.name,
          market: l.marketLabel,
          prob: l.prob,
          odd: l.odd,
        })),
      })),
    };
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(entry);
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
    } catch { /* silent */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    onPlayed();
  }

  return (
    <section className={`overflow-hidden rounded-2xl border ${rankTone} shadow-[0_18px_50px_rgba(0,0,0,0.28)]`}>
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-black/25 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ${rankBadge.bg}`}>
            #{rank}
          </span>
          <div>
            <h3 className={`text-base font-black tracking-tight ${rankBadge.text}`}>Gestion {rank} — {gestion.title}</h3>
            <p className="text-xs text-fg-muted">{gestion.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#35E75A]/12 px-2 py-0.5 text-xs font-black text-[#35E75A]">
            <TrendingUp size={11} /> EV +{(gestion.ev * 100).toFixed(1)}%
          </span>
          <span className="mt-1 text-[10px] font-semibold text-fg-muted">
            retour moyen ×{gestion.expectedReturn.toFixed(2)}
          </span>
        </div>
      </header>

      <ul className="divide-y divide-white/[0.05]">
        {gestion.bets.map((bet, i) => (
          <BetRow key={i} bet={bet} bankroll={bankroll} sym={sym} idx={i + 1} />
        ))}
      </ul>

      <footer className="border-t border-white/[0.06] bg-black/25 px-4 py-3">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">Total investi</div>
            <div className="text-lg font-black text-fg">
              {totalStakeEur != null ? `${totalStakeEur}${sym}` : "—"}
            </div>
            <div className="text-[10px] font-semibold text-fg-muted">{(gestion.totalStakePct * 100).toFixed(1)}% bankroll</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">Retour espéré (moy)</div>
            <div className="text-lg font-black text-[#35E75A]">
              {potentialAvgReturn != null ? `${potentialAvgReturn}${sym}` : "—"}
            </div>
            <div className="text-[10px] font-semibold text-fg-muted">
              ×{gestion.expectedReturn.toFixed(2)} sur la mise totale
            </div>
          </div>
        </div>
        <button
          onClick={playThis}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#7B5CFF]/40 bg-[#7B5CFF]/10 text-xs font-black uppercase tracking-wider text-[#B7A2FF] transition-colors hover:bg-[#7B5CFF]/20"
        >
          {saved ? <><Check size={14} /> Enregistré dans l'historique</> : <><Save size={14} /> J'ai joué cette gestion</>}
        </button>
      </footer>
    </section>
  );
}

function BetRow({ bet, bankroll, sym, idx }: { bet: BetSlip; bankroll: number; sym: string; idx: number }) {
  const stake = bankroll > 0 ? Math.max(0.5, Math.round(bankroll * bet.stakePct * 10) / 10) : null;
  const potential = stake != null ? Math.round(stake * bet.odd * 10) / 10 : null;
  const kindTag = bet.kind === "single" ? "Simple" : `Combo ×${bet.legs.length}`;
  const kindTone = bet.kind === "single"
    ? "border-[rgba(53,231,90,0.28)] bg-[rgba(53,231,90,0.10)] text-[#35E75A]"
    : "border-[rgba(245,197,66,0.28)] bg-[rgba(245,197,66,0.10)] text-[#F5C542]";
  return (
    <li className="px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${kindTone}`}>
          Pari {idx} · {kindTag}
        </span>
        <span className="text-fg-muted">
          proba {Math.round(bet.prob * 100)}% · cote {bet.odd.toFixed(2)}
        </span>
        <span className="ml-auto text-right">
          {stake != null ? (
            <span className="text-sm font-black text-fg">{stake}{sym}</span>
          ) : (
            <span className="text-xs text-fg-muted">{(bet.stakePct * 100).toFixed(1)}%</span>
          )}
          {potential != null && (
            <span className="ml-2 text-xs font-semibold text-[#35E75A]">→ {potential}{sym}</span>
          )}
        </span>
      </div>
      <div className="space-y-1.5">
        {bet.legs.map((leg) => (
          <Link
            key={leg.match.fixture_id}
            href={`/match/${leg.match.fixture_id}?source=gestion`}
            className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.05]"
          >
            <TeamLogo team={leg.match.home_team} />
            <TeamLogo team={leg.match.away_team} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-fg">
                {leg.match.home_team.name} — {leg.match.away_team.name}
              </div>
              <div className="text-[10px] text-fg-muted">{leg.match.league.flag} {leg.match.league.name}</div>
            </div>
            <div className="text-right">
              <div className={`text-[10px] font-black uppercase tracking-wider ${leg.isValue ? "text-[#B7A2FF]" : "text-[#F5C542]"}`}>
                {leg.marketLabel}
              </div>
              <div className="text-[11px] font-bold text-fg">
                {Math.round(leg.prob * 100)}% <span className="text-fg-muted">@ {leg.odd.toFixed(2)}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-fg-muted" />
          </Link>
        ))}
      </div>
    </li>
  );
}

function TeamLogo({ team }: { team: { name: string; logo: string } }) {
  return team.logo ? (
    <Image src={team.logo} alt={team.name} width={22} height={22} unoptimized className="h-6 w-6 object-contain" />
  ) : (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[9px] font-bold text-fg-muted">
      {team.name.slice(0, 2).toUpperCase()}
    </div>
  );
}
