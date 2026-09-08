import { BookOpen, AlertCircle } from "lucide-react";
import type { MatchContext } from "@/lib/types";

/**
 * Phase 3 — Lecture contextuelle humanisée (fallback-safe).
 * Affiche `context.narrative_lines` + un encart prudent si `data_completeness` est faible.
 * Ne rend rien si `context` est absent, vide, ou sans ligne narrative.
 */
const RISK_LABEL: Record<string, { label: string; cls: string }> = {
  LOW:  { label: "Lecture cohérente",   cls: "text-[rgba(243,246,247,0.62)] border-white/[0.10] bg-white/[0.03]" },
  MED:  { label: "À surveiller",         cls: "text-[#F5C542] border-[#F5C542]/30 bg-[#F5C542]/[0.08]" },
  HIGH: { label: "Risque contextuel élevé", cls: "text-[#FF6B6B] border-[#FF6B6B]/30 bg-[#FF6B6B]/[0.08]" },
};

export function ContextNarrativeCard({ context }: { context: MatchContext | null | undefined }) {
  if (!context) return null;
  const lines = context.narrative_lines || [];
  if (lines.length === 0) return null;

  const score = context.score || { score: 0, risk_level: "LOW", data_completeness: 1, active_count: 0 };
  const completeness = typeof score.data_completeness === "number" ? score.data_completeness : 1;
  const isPartial = completeness < 0.6;
  const risk = RISK_LABEL[score.risk_level] || RISK_LABEL.LOW;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[rgba(7,16,24,0.82)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:rounded-3xl sm:p-5 lg:p-6 xl:col-span-2">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5C542]/12 text-[#F5C542]">
          <BookOpen size={18} strokeWidth={2.4} />
        </span>
        <h2 className="text-base font-black tracking-[-0.02em] text-[#F3F6F7] sm:text-lg lg:text-xl">
          Lecture contextuelle
        </h2>
        <span
          className={`ml-auto inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold uppercase tracking-[0.06em] ${risk.cls}`}
        >
          {risk.label}
        </span>
      </div>

      <ul className="space-y-2.5">
        {lines.map((line, idx) => (
          <li
            key={idx}
            className="flex gap-2.5 text-sm font-medium leading-relaxed text-[rgba(243,246,247,0.82)] sm:text-[15px]"
          >
            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5C542]/70" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {isPartial && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#F5C542]/25 bg-[#F5C542]/[0.06] p-3 text-[12px] font-medium text-[#F5C542]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            Analyse partielle : certaines données contextuelles ne sont pas disponibles (complétude estimée {Math.round(completeness * 100)}%).
          </span>
        </div>
      )}
    </section>
  );
}
