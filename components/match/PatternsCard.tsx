import { Radar, TrendingUp, TrendingDown } from "lucide-react";
import type { MatchDetail } from "@/lib/types";

/**
 * Affiche les récurrences détectées par le pattern_engine backend.
 * Chaque hit combine des signaux transverses (blessures × cotes × classement × H2H …).
 */
export function PatternsCard({ match }: { match: MatchDetail }) {
  const patterns = match.smart_bet?.patterns_full || [];
  const summary = match.smart_bet?.patterns_summary;
  if (!patterns.length) return null;

  return (
    <section className="rounded-2xl border border-[rgba(123,92,255,0.24)] bg-[rgba(10,18,24,0.82)] p-4 shadow-[0_10px_32px_rgba(0,0,0,0.24)]">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7B5CFF]/20 text-[#B7A2FF]">
            <Radar size={16} />
          </div>
          <div>
            <div className="text-sm font-bold text-fg">Récurrences détectées</div>
            <div className="text-[11px] text-fg-muted">
              {patterns.length} règle{patterns.length > 1 ? "s" : ""} croise{patterns.length > 1 ? "nt" : ""} plusieurs signaux
            </div>
          </div>
        </div>
        {summary && (
          <SummaryChip summary={summary} />
        )}
      </header>
      <ul className="space-y-2">
        {patterns.map((p, i) => (
          <PatternRow key={i} pattern={p} />
        ))}
      </ul>
    </section>
  );
}

function SummaryChip({ summary }: { summary: NonNullable<MatchDetail["smart_bet"]>["patterns_summary"] }) {
  if (!summary) return null;
  const bias = summary.total_winner_bias;
  const abs = Math.abs(bias);
  const tone = abs < 0.05
    ? { icon: null, cls: "text-fg-muted border-white/10 bg-white/[0.03]" }
    : bias > 0
      ? { icon: <TrendingUp size={11} />, cls: "text-[#35E75A] border-[#35E75A]/25 bg-[#35E75A]/10" }
      : { icon: <TrendingDown size={11} />, cls: "text-[#E85B5B] border-[#E85B5B]/25 bg-[#E85B5B]/10" };
  const label = abs < 0.05
    ? "signal net absent"
    : bias > 0
      ? `→ domicile ${bias > 0.25 ? "fort" : "léger"}`
      : `→ extérieur ${abs > 0.25 ? "fort" : "léger"}`;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${tone.cls}`}>
      {tone.icon} {label}
    </span>
  );
}

function PatternRow({ pattern }: { pattern: { name: string; reason: string; confidence: number; winner_bias?: number } }) {
  const bias = pattern.winner_bias ?? 0;
  const dotTone = Math.abs(bias) < 0.05
    ? "bg-fg-muted"
    : bias > 0 ? "bg-[#35E75A]" : "bg-[#E85B5B]";
  const conf = Math.round(pattern.confidence * 100);
  return (
    <li className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotTone}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-tight text-fg">{pattern.reason}</div>
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
          confiance {conf}%
        </div>
      </div>
    </li>
  );
}
