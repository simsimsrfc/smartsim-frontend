import type { MatchAnalysisView, ProbabilityItem } from "./types";
import { formatProbability } from "./matchUtils";

export function ProbabilitySummary({ items, activeTab }: { items: ProbabilityItem[]; activeTab: MatchAnalysisView }) {
  const highlightedTab =
    activeTab === "recommendation-over25" ? "over25" : activeTab === "recommendation-result" ? "result" : activeTab;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[rgba(7,16,24,0.82)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:rounded-3xl sm:p-5 lg:p-6">
      <h2 className="mb-3 text-base font-black tracking-[-0.02em] text-[#F3F6F7] sm:text-lg lg:text-xl">Résumé des probabilités</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className={`min-h-[84px] rounded-2xl border p-3 sm:min-h-[92px] ${
              item.key === highlightedTab
                ? "border-[#35E75A]/60 bg-[#35E75A]/10"
                : "border-white/[0.06] bg-white/[0.035]"
            }`}
          >
            <div className="text-xs font-black text-[#F3F6F7]">{item.label}</div>
            <div className="mt-2 text-2xl font-black leading-none text-[#F3F6F7]">
              {item.value === null ? "Indispo." : item.key === "result" ? item.helper : formatProbability(item.value)}
            </div>
            <div className="mt-1 text-xs font-semibold text-[rgba(243,246,247,0.56)]">
              {item.value === null ? "Indisponible" : item.key === "result" ? `Confiance ${formatProbability(item.value)}` : "Probabilité"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
