import { api } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";
import { SmartSimClient } from "./SmartSimClient";

export const revalidate = 30;
export const metadata = { title: "Smart Sim" };

export default async function SmartSimPage() {
  let matches: MatchSummary[] = [];
  let resultMatches: MatchSummary[] = [];
  let error: string | null = null;

  try {
    const [smartData, dayData] = await Promise.all([
      api.smartSelections(0, "today"),
      api.matchesByDay("today"),
    ]);
    matches = smartData.matches;
    resultMatches = dayData.matches;
  } catch (e) {
    error = (e as Error).message;
  }

  return <SmartSimClient matches={matches} resultMatches={resultMatches} error={error} />;
}
