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

type ComboBucket = { size: 2 | 3 | 4; combos: Combo[] };

function buildBuckets(candidates: Leg[]): ComboBucket[] {
  if (candidates.length < 2) return [];
  // Dedup by fixture, keep best positive-edge leg per match
  const byFixture = new Map<string, Leg>();
  for (const l of candidates) {
    const prev = byFixture.get(l.match.fixture_id);
    const edge = l.prob * l.odd - 1;
    const prevEdge = prev ? prev.prob * prev.odd - 1 : -Infinity;
    if (edge > prevEdge) byFixture.set(l.match.fixture_id, l);
  }
  const positive = [...byFixture.values()].filter((l) => l.prob * l.odd > 1);
  const pool = (positive.length >= 2 ? positive : [...byFixture.values()])
    .sort((a, b) => b.prob * b.odd - a.prob * a.odd)
    .slice(0, 10);

  const build = (k: 2 | 3 | 4): Combo[] => {
    if (pool.length < k) return [];
    const out: Combo[] = [];
    for (const legs of combinations(pool, k)) {
      const jointProb = legs.reduce((acc, l) => acc * l.prob, 1);
      const combinedOdd = legs.reduce((acc, l) => acc * l.odd, 1);
      const ev = jointProb * combinedOdd - 1;
      if (ev <= 0) continue;
      const kellyPct = fractionalKelly(jointProb, combinedOdd);
      out.push({ legs, jointProb, combinedOdd, ev, kellyPct });
    }
    return out;
  };

  // 2 legs → prefer high joint probability (safer bets)
  const twos = build(2).sort((a, b) => b.jointProb - a.jointProb).slice(0, 3);
  // 3 legs → balanced (sort by EV)
  const threes = build(3).sort((a, b) => b.ev - a.ev).slice(0, 3);
  // 4 legs → fun (highest combined odd with positive EV)
  const fours = build(4).sort((a, b) => b.combinedOdd - a.combinedOdd).slice(0, 2);

  return [
    { size: 2, combos: twos },
    { size: 3, combos: threes },
    { size: 4, combos: fours },
  ].filter((b) => b.combos.length > 0) as ComboBucket[];
}

const BUCKET_META: Record<2 | 3 | 4, { title: string; subtitle: string; tone: string; borderTone: string }> = {
  2: {
    title: "Doubles sûrs",
    subtitle: "Deux jambes à forte probabilité — la couche la plus régulière.",
    tone: "text-[#35E75A]",
    borderTone: "border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.05)]",
  },
  3: {
    title: "Triples équilibrés",
    subtitle: "Trois matchs — meilleur ratio valeur / risque.",
    tone: "text-[#F5C542]",
    borderTone: "border-[rgba(245,197,66,0.24)] bg-[rgba(245,197,66,0.05)]",
  },
  4: {
    title: "Combos fun",
    subtitle: "Quatre matchs — cote élevée, à jouer très petit.",
    tone: "text-[#B7A2FF]",
    borderTone: "border-[rgba(123,92,255,0.28)] bg-[rgba(123,92,255,0.06)]",
  },
};

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
  const buckets = useMemo(() => buildBuckets(candidates), [candidates]);
  const totalCombos = buckets.reduce((acc, b) => acc + b.combos.length, 0);

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

      {!loading && candidates.length >= 2 && totalCombos === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[rgba(5,12,18,0.58)] px-4 py-8 text-center text-sm text-fg-muted">
          Aucun combo à valeur positive détecté ({candidates.length} candidats analysés).
        </div>
      )}

      {buckets.map((bucket) => {
        const meta = BUCKET_META[bucket.size];
        return (
          <section key={bucket.size} className={`overflow-hidden rounded-[22px] border ${meta.borderTone} p-4`}>
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-extrabold tracking-tight ${meta.tone}`}>{meta.title}</h2>
                <p className="text-xs text-fg-muted">{meta.subtitle}</p>
              </div>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-fg-muted">
                {bucket.combos.length} combo{bucket.combos.length > 1 ? "s" : ""}
              </span>
            </header>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {bucket.combos.map((combo, i) => (
                <ComboCard key={i} combo={combo} rank={i + 1} bankroll={bkAmount} currency={currency} />
              ))}
            </div>
          </section>
        );
      })}

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
  // Minimum stake floor of 1 unit to avoid 0.x tiny stakes when bankroll set
  const rawStake = bankroll > 0 ? bankroll * combo.kellyPct : 0;
  const stake = bankroll > 0 ? Math.max(1, Math.round(rawStake * 10) / 10) : null;
  const potentialReturn = stake != null ? Math.round(stake * combo.combinedOdd * 10) / 10 : null;
  const potentialProfit = stake != null && potentialReturn != null ? Math.round((potentialReturn - stake) * 10) / 10 : null;
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : ` ${currency}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(10,18,24,0.82)] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-black/25 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-black text-fg">#{rank}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">{combo.legs.length} jambes</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[#35E75A]/12 px-2 py-0.5 text-[11px] font-black text-[#35E75A]">
          <TrendingUp size={11} /> EV +{(combo.ev * 100).toFixed(1)}%
        </div>
      </header>

      <ul className="divide-y divide-white/[0.05]">
        {combo.legs.map((leg) => (
          <li key={leg.match.fixture_id}>
            <Link
              href={`/match/${leg.match.fixture_id}?source=combos`}
              className="flex items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              <TeamLogo team={leg.match.home_team} />
              <TeamLogo team={leg.match.away_team} />
              <div className="ml-1 min-w-0 flex-1">
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
            </Link>
          </li>
        ))}
      </ul>

      <footer className="border-t border-white/[0.06] bg-black/25 px-4 py-3">
        <div className="mb-2 grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">Proba jointe</div>
            <div className="text-sm font-black text-fg">{(combo.jointProb * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-fg-muted">Cote combinée</div>
            <div className="text-sm font-black text-[#F5C542]">{combo.combinedOdd.toFixed(2)}</div>
          </div>
        </div>
        {stake != null ? (
          <div className="rounded-lg border border-[#7B5CFF]/25 bg-[#7B5CFF]/8 px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#B7A2FF]">Mise conseillée</div>
                <div className="text-lg font-black text-fg">{stake}{symbol}</div>
                <div className="text-[10px] text-fg-muted">{(combo.kellyPct * 100).toFixed(2)}% bankroll</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#35E75A]">Si gagné</div>
                <div className="text-lg font-black text-[#35E75A]">{potentialReturn}{symbol}</div>
                <div className="text-[10px] font-semibold text-[#35E75A]/80">gain net +{potentialProfit}{symbol}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center text-[11px] text-fg-muted">
            Renseigne ta bankroll pour voir la mise et le gain.
          </div>
        )}
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
