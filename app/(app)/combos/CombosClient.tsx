"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers, TrendingUp, Info, CalendarDays } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { api } from "@/lib/api";
import { useBankroll } from "@/lib/useBankroll";
import { BankrollControl } from "@/components/bankroll/BankrollControl";
import { PageHeader } from "@/components/layout/PageHeader";

type Day = "today" | "tomorrow";

type Leg = {
  match: MatchSummary;
  market: "over_25" | "over_15" | "btts";
  marketLabel: string;
  prob: number;
  odd: number;
  isValue: boolean;
};

type Combo = {
  legs: Leg[];
  jointProb: number;
  combinedOdd: number;
  ev: number;         // expected value (jointProb * combinedOdd - 1)
  kellyPct: number;   // fractional Kelly stake as % of bankroll
};

const MARKET_LABEL: Record<Leg["market"], string> = {
  over_25: "+2.5 buts",
  over_15: "+1.5 buts",
  btts: "BTTS",
};

function fractionalKelly(p: number, o: number): number {
  // Quarter Kelly, cap 5% for parlays (more variance than singles)
  if (o <= 1) return 0;
  const raw = (p * o - 1) / (o - 1);
  if (raw <= 0) return 0;
  return Math.min(0.05, raw * 0.25);
}

function legFromMatch(m: MatchSummary): Leg | null {
  const over25 = m.probabilities?.over_25 || 0;
  const oddOver = m.odds?.over_25 || 0;
  const btts = m.probabilities?.btts || 0;
  const oddBtts = m.odds?.btts || 0;
  const isValue = !!m.smart_bet?.is_value;

  // Prefer market chosen by backend if it's a value bet
  const chosen = m.smart_bet?.kelly_market as Leg["market"] | undefined;
  if (chosen && ["over_25", "btts", "over_15"].includes(chosen)) {
    const p = m.probabilities?.[chosen] ?? 0;
    const o = m.odds?.[chosen] ?? 0;
    if (p > 0 && o > 1) {
      return { match: m, market: chosen, marketLabel: MARKET_LABEL[chosen], prob: p, odd: o, isValue };
    }
  }
  // Fallback: over_25 with odds if strong enough
  if (over25 >= 0.6 && oddOver > 1) {
    return { match: m, market: "over_25", marketLabel: MARKET_LABEL.over_25, prob: over25, odd: oddOver, isValue };
  }
  if (btts >= 0.6 && oddBtts > 1) {
    return { match: m, market: "btts", marketLabel: MARKET_LABEL.btts, prob: btts, odd: oddBtts, isValue };
  }
  return null;
}

// Choose k out of arr
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

function buildCombos(candidates: Leg[]): Combo[] {
  if (candidates.length < 2) return [];
  // Keep only positive-edge legs (prob * odd > 1)
  const positive = candidates.filter((l) => l.prob * l.odd > 1);
  const pool = (positive.length >= 3 ? positive : candidates).slice(0, 10);
  // Group by fixture to avoid duplicating same match
  const fixtureIds = new Set<string>();
  const dedup: Leg[] = [];
  for (const l of pool) {
    if (fixtureIds.has(l.match.fixture_id)) continue;
    fixtureIds.add(l.match.fixture_id);
    dedup.push(l);
  }
  const sizes = [3, 4].filter((k) => k <= dedup.length);
  if (sizes.length === 0 && dedup.length >= 2) sizes.push(dedup.length);
  const allCombos: Combo[] = [];
  for (const k of sizes) {
    for (const legs of combinations(dedup, k)) {
      const jointProb = legs.reduce((acc, l) => acc * l.prob, 1);
      const combinedOdd = legs.reduce((acc, l) => acc * l.odd, 1);
      const ev = jointProb * combinedOdd - 1;
      if (ev <= 0) continue;
      const kellyPct = fractionalKelly(jointProb, combinedOdd);
      allCombos.push({ legs, jointProb, combinedOdd, ev, kellyPct });
    }
  }
  // Sort by EV desc, keep top 6
  return allCombos.sort((a, b) => b.ev - a.ev).slice(0, 6);
}

export function CombosClient({ userEmail }: { userEmail: string }) {
  const [day, setDay] = useState<Day>("today");
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const combos = useMemo(() => buildCombos(candidates), [candidates]);

  const currency = bankroll?.currency || "EUR";
  const bkAmount = bankroll?.amount || 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Combos bankroll" subtitle="Sélections combinées à valeur positive — gestion Kelly fractionnaire pour parlays." />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(123,92,255,0.24)] bg-[rgba(123,92,255,0.06)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7B5CFF]/20 text-[#B7A2FF]">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-fg">Bankroll de référence</div>
            <div className="text-xs text-fg-muted">Modifiable ici — synchronisé avec Paramètres et Smart Sim.</div>
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

      {!loading && candidates.length < 2 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[rgba(5,12,18,0.58)] px-4 py-8 text-center text-sm text-fg-muted">
          Pas assez de matchs éligibles pour construire un combo aujourd'hui.
        </div>
      )}

      {!loading && candidates.length >= 2 && combos.length === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[rgba(5,12,18,0.58)] px-4 py-8 text-center text-sm text-fg-muted">
          Aucun combo à valeur positive détecté ({candidates.length} candidats analysés).
        </div>
      )}

      {combos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {combos.map((combo, i) => (
            <ComboCard key={i} combo={combo} rank={i + 1} bankroll={bkAmount} currency={currency} />
          ))}
        </div>
      )}

      <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3 text-xs leading-relaxed text-fg-muted">
        <Info size={12} className="mr-1 inline-block text-[#B7A2FF]" />
        <strong className="text-fg">Méthode :</strong> chaque combo agrège les probabilités et cotes des jambes indépendantes.
        Mise = Kelly fractionnaire (¼ Kelly, plafond 5% bankroll) sur (proba jointe, cote combinée).
        Un combo n'apparaît que si l'espérance mathématique est &gt; 0.
      </p>
    </div>
  );
}

function ComboCard({ combo, rank, bankroll, currency }: { combo: Combo; rank: number; bankroll: number; currency: string }) {
  const stakeEur = bankroll > 0 ? Math.round(bankroll * combo.kellyPct * 10) / 10 : null;
  const potentialWin = stakeEur != null ? Math.round(stakeEur * combo.combinedOdd * 10) / 10 : null;
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : ` ${currency}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-[rgba(123,92,255,0.24)] bg-[rgba(10,18,24,0.82)] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-[rgba(123,92,255,0.06)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7B5CFF] text-xs font-black text-white">#{rank}</span>
          <span className="text-sm font-bold text-fg">Combo {combo.legs.length} matchs</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[#35E75A]/12 px-2 py-1 text-xs font-black text-[#35E75A]">
          <TrendingUp size={12} /> EV +{(combo.ev * 100).toFixed(1)}%
        </div>
      </header>

      <ul className="divide-y divide-white/[0.05]">
        {combo.legs.map((leg) => (
          <li key={leg.match.fixture_id}>
            <Link
              href={`/match/${leg.match.fixture_id}?source=combos`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <TeamLogo team={leg.match.home_team} />
              <span className="text-xs font-semibold text-fg-muted">vs</span>
              <TeamLogo team={leg.match.away_team} />
              <div className="ml-2 min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-fg">
                  {leg.match.home_team.name} — {leg.match.away_team.name}
                </div>
                <div className="text-[11px] text-fg-muted">{leg.match.league.flag} {leg.match.league.name}</div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-wider ${leg.isValue ? "text-[#B7A2FF]" : "text-[#F5C542]"}`}>
                  {leg.marketLabel}
                </div>
                <div className="text-xs font-bold text-fg">
                  {Math.round(leg.prob * 100)}% <span className="text-fg-muted">@ {leg.odd.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="grid grid-cols-3 gap-2 border-t border-white/[0.06] bg-black/20 px-4 py-3 text-center">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">Proba jointe</div>
          <div className="text-sm font-black text-fg">{(combo.jointProb * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">Cote combinée</div>
          <div className="text-sm font-black text-[#F5C542]">{combo.combinedOdd.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">Mise conseillée</div>
          <div className="text-sm font-black text-[#B7A2FF]">
            {stakeEur != null ? `${stakeEur}${symbol}` : `${(combo.kellyPct * 100).toFixed(2)}%`}
          </div>
          {potentialWin != null && (
            <div className="text-[10px] font-semibold text-[#35E75A]">→ {potentialWin}{symbol}</div>
          )}
        </div>
      </footer>
    </section>
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
