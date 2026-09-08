import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { MatchDetail } from "@/lib/types";
import { MatchHero } from "./MatchHero";
import { MatchAnalysisTabs } from "./MatchAnalysisTabs";
import { PrimaryAnalysisCard } from "./PrimaryAnalysisCard";
import { WhyAnalysisCard } from "./WhyAnalysisCard";
import { ProbabilitySummary } from "./ProbabilitySummary";
import { MatchContextCard } from "./MatchContextCard";
import { NarrativeSummaryCard } from "./NarrativeSummaryCard";
import { SmartSummaryCard } from "./SmartSummaryCard";
import { ContextNarrativeCard } from "./ContextNarrativeCard";
import { MatchDisclaimer } from "./MatchDisclaimer";
import { getAnalysisViewConfig, getMatchAnalysisTabs, getProbabilityItems } from "./matchAnalysisConfig";
import type { MatchAnalysisSource, MatchAnalysisView } from "./types";

export function MatchAnalysisPage({
  match,
  fixtureId,
  source,
  activeTab,
}: {
  match: MatchDetail;
  fixtureId: string;
  source: MatchAnalysisSource;
  activeTab: MatchAnalysisView;
}) {
  const tabs = getMatchAnalysisTabs(source);
  const activeView = tabs.some((tab) => tab.key === activeTab) ? activeTab : tabs[0]?.key || "over25";
  const viewConfig = getAnalysisViewConfig(activeView, match);
  const probabilityItems = getProbabilityItems(match);

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-3 overflow-x-hidden sm:gap-4">
      <BackButton />
      <MatchHero match={match} source={source} activeTab={activeView} />
      <MatchAnalysisTabs fixtureId={fixtureId} source={source} tabs={tabs} activeTab={activeView} />
      {/* Phase 2 — Smart summary (fallback-safe, ne rend rien si insights absent) */}
      <SmartSummaryCard insights={match.insights} />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <PrimaryAnalysisCard data={viewConfig} />
          <ProbabilitySummary items={probabilityItems} activeTab={activeView} />
        </div>
        <WhyAnalysisCard title={viewConfig.whyTitle} signals={viewConfig.signals} />
        <MatchContextCard match={match} />
        <ContextNarrativeCard context={match.context} />
        <NarrativeSummaryCard title={viewConfig.summaryTitle} text={viewConfig.summary} />
      </div>
      <MatchDisclaimer />
    </div>
  );
}

function BackButton() {
  return (
    <Link
      href="/matches"
      className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[rgba(243,246,247,0.58)] transition-colors hover:text-[#F3F6F7]"
    >
      <ArrowLeft size={16} />
      Retour aux matchs
    </Link>
  );
}
