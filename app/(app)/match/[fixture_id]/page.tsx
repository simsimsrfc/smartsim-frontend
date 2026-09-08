import { api } from "@/lib/api";
import type { MatchDetail, MatchSummary } from "@/lib/types";
import { MatchAnalysisPage } from "@/components/match/MatchAnalysisPage";
import { parseAnalysisView } from "@/components/match/matchAnalysisConfig";
import { normalizeMatchForAnalysis, teamLogoFromMatchesMapping } from "@/components/match/matchUtils";

export const revalidate = 30;

type Props = {
  params: { fixture_id: string };
  searchParams?: { source?: string; tab?: string };
};

export async function generateMetadata() {
  return { title: "Fiche match — Smart Sim" };
}

export default async function MatchDetailPage({ params, searchParams }: Props) {
  let match: MatchDetail | null = null;
  let error: string | null = null;

  try {
    match = normalizeMatchForAnalysis(await api.matchDetail(params.fixture_id));
    match = await completeLogosFromMatchesList(params.fixture_id, match);
  } catch (e) {
    const message = (e as Error).message;
    match = await findMatchSummaryFallback(params.fixture_id);
    if (!match) error = message;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!match) return null;

  return (
    <MatchAnalysisPage
      match={match}
      fixtureId={params.fixture_id}
      source={searchParams?.source || "matches"}
      activeTab={parseAnalysisView(searchParams?.source || "matches", searchParams?.tab)}
    />
  );
}

async function findMatchSummaryFallback(fixtureId: string): Promise<MatchDetail | null> {
  try {
    const [today, tomorrow] = await Promise.all([
      api.matchesByDay("today"),
      api.matchesByDay("tomorrow"),
    ]);
    const summary = [...today.matches, ...tomorrow.matches].find(
      (match) => String(match.fixture_id) === String(fixtureId)
    );
    return summary ? normalizeMatchForAnalysis(summaryToDetail(summary)) : null;
  } catch {
    return null;
  }
}

async function completeLogosFromMatchesList(fixtureId: string, detail: MatchDetail): Promise<MatchDetail> {
  if (detail.home_team?.logo?.trim() && detail.away_team?.logo?.trim()) return detail;

  try {
    const [today, tomorrow] = await Promise.all([
      api.matchesByDay("today"),
      api.matchesByDay("tomorrow"),
    ]);
    const summary = [...today.matches, ...tomorrow.matches].find(
      (match) => String(match.fixture_id) === String(fixtureId)
    );
    if (!summary) return detail;

    return {
      ...detail,
      home_team: {
        ...detail.home_team,
        name: detail.home_team?.name || summary.home_team?.name || "",
        logo:
          detail.home_team?.logo?.trim() ||
          teamLogoFromMatchesMapping({
            id: summary.home_team?.id ?? null,
            name: summary.home_team?.name || "",
            logo: summary.home_team?.logo || "",
          }),
      },
      away_team: {
        ...detail.away_team,
        name: detail.away_team?.name || summary.away_team?.name || "",
        logo:
          detail.away_team?.logo?.trim() ||
          teamLogoFromMatchesMapping({
            id: summary.away_team?.id ?? null,
            name: summary.away_team?.name || "",
            logo: summary.away_team?.logo || "",
          }),
      },
    };
  } catch {
    return detail;
  }
}

function summaryToDetail(match: MatchSummary): MatchDetail {
  return {
    ...match,
    home_team: {
      id: match.home_team?.id ?? null,
      name: match.home_team?.name || "",
      logo: teamLogoFromMatchesMapping({
        id: match.home_team?.id ?? null,
        name: match.home_team?.name || "",
        logo: match.home_team?.logo || "",
      }),
    },
    away_team: {
      id: match.away_team?.id ?? null,
      name: match.away_team?.name || "",
      logo: teamLogoFromMatchesMapping({
        id: match.away_team?.id ?? null,
        name: match.away_team?.name || "",
        logo: match.away_team?.logo || "",
      }),
    },
    form: { home: [], away: [] },
    h2h: [],
    analysis: { commentary: "", model: { xgb: 0, lgb: 0 } },
  };
}
