"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, CalendarDays, Trophy } from "lucide-react";
import type { MatchSummary } from "@/lib/types";
import { api } from "@/lib/api";
import { over25DisplayProbability } from "@/lib/probabilities";
import { Logo } from "@/components/layout/Logo";
import { MatchCard } from "@/components/matches/MatchCard";
import { useUserEmail } from "@/components/providers/UserProvider";
import { isAdmin } from "@/lib/admin";
import { BankrollControl } from "@/components/bankroll/BankrollControl";

type SelectedDay = "today" | "tomorrow";

function resultPickProbability(match: MatchSummary): number | null {
  const selection = match?.result_selection;
  if (!selection?.is_result_selection || !selection.pick || !selection.probability) return null;
  return selection.probability;
}

function byResultConfidence(matches: MatchSummary[]): MatchSummary[] {
  // Smart Sim Résultat = évidence (winner conf ≥ 55%) OU value bet 1X2
  return [...(matches || [])]
    .filter((match) => {
      const p = resultPickProbability(match);
      const isValue = !!match?.smart_bet?.is_value;
      return (p !== null && p >= 0.55) || isValue;
    })
    .sort((a, b) => (resultPickProbability(b) || 0) - (resultPickProbability(a) || 0));
}

function byOver25(matches: MatchSummary[]): MatchSummary[] {
  // Smart Sim +2,5 = évidence (O2.5 ≥ 55%) OU value bet
  return [...(matches || [])]
    .filter((match) => {
      const o = match?.probabilities?.over_25 || 0;
      const isValue = !!match?.smart_bet?.is_value;
      return Number.isFinite(o) && (o >= 0.55 || isValue);
    })
    .sort((a, b) => b.probabilities.over_25 - a.probabilities.over_25);
}

export function SmartSimClient({ matches, resultMatches, error }: { matches: MatchSummary[]; resultMatches: MatchSummary[]; error: string | null }) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay>("today");
  const [dayMatches, setDayMatches] = useState<MatchSummary[]>(matches);
  const [dayResultMatches, setDayResultMatches] = useState<MatchSummary[]>(resultMatches);
  const [dayError, setDayError] = useState<string | null>(error);
  const [resultVisible, setResultVisible] = useState(6);
  const [over25Visible, setOver25Visible] = useState(6);

  useEffect(() => {
    let cancelled = false;

    async function loadSmartSelections() {
      try {
        const [smartData, allData] = await Promise.all([
          api.smartSelections(0, selectedDay),
          api.matchesByDay(selectedDay),
        ]);
        if (!cancelled) {
          setDayMatches(smartData?.matches || []);
          setDayResultMatches(allData?.matches || []);
          setDayError(null);
          setResultVisible(6);
          setOver25Visible(6);
        }
      } catch (e) {
        if (!cancelled) {
          setDayMatches([]);
          setDayResultMatches([]);
          setDayError((e as Error).message);
        }
      }
    }

    loadSmartSelections();

    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const userEmail = useUserEmail();
  const admin = isAdmin(userEmail);
  const label = selectedDay === "today" ? "Sélections du jour" : "Sélections de demain";
  const resultPicks = byResultConfidence(dayResultMatches);
  const over25Picks = byOver25(dayMatches);
  const visibleResultPicks = resultPicks;
  const visibleOver25Picks = over25Picks;

  return (
    <div className="space-y-5">
      <SmartHero selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {dayError && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 font-mono text-sm text-danger">
          {dayError}
        </div>
      )}

      {admin && userEmail && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(123,92,255,0.24)] bg-[rgba(123,92,255,0.06)] px-4 py-3">
          <div className="text-xs">
            <div className="font-bold text-fg">Bankroll de référence</div>
            <div className="text-fg-muted">Les mises Kelly (★ Value) s'ajustent instantanément.</div>
          </div>
          <BankrollControl userEmail={userEmail} compact />
        </section>
      )}

      {!dayError && (
        <>
          <p className="text-sm font-semibold text-[rgba(243,246,247,0.50)]">{label}</p>

          <SelectionPanel
            icon={<Trophy size={20} />}
            title="Avis résultat du match"
            subtitle="Les avis les plus convaincants sur l'issue du match."
          >
            {resultPicks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visibleResultPicks.map((match) => (
                    <MatchCard
                      key={match.fixture_id}
                      match={match}
                      variant="gold"
                      compact
                      href={`/match/${match.fixture_id}?source=smart-result`}
                    />
                  ))}
                </div>
                {visibleResultPicks.length < resultPicks.length && (
                  <SeeMoreButton onClick={() => setResultVisible((value) => value + 6)} remaining={resultPicks.length - visibleResultPicks.length} />
                )}
              </>
            ) : (
              <PanelMessage>
                {selectedDay === "today"
                  ? "Aucun avis résultat disponible aujourd'hui."
                  : "Aucun avis résultat disponible demain."}
              </PanelMessage>
            )}
          </SelectionPanel>

          <SelectionPanel
            icon={<BarChart3 size={20} />}
            title="+2,5 buts"
            subtitle="Les rencontres au profil offensif le plus intéressant."
          >
            {over25Picks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visibleOver25Picks.map((match) => (
                    <MatchCard
                      key={match.fixture_id}
                      match={match}
                      variant="gold"
                      compact
                      href={`/match/${match.fixture_id}?source=smart-over25`}
                    />
                  ))}
                </div>
                {visibleOver25Picks.length < over25Picks.length && (
                  <SeeMoreButton onClick={() => setOver25Visible((value) => value + 6)} remaining={over25Picks.length - visibleOver25Picks.length} />
                )}
              </>
            ) : (
              <PanelMessage>
                {selectedDay === "today"
                  ? "Aucun avis +2,5 disponible aujourd'hui."
                  : "Aucun avis +2,5 disponible demain."}
              </PanelMessage>
            )}
          </SelectionPanel>
        </>
      )}

      <p className="text-center text-xs font-medium text-[rgba(243,246,247,0.42)]">
        Les avis affichés sont issus d'une lecture statistique et ne garantissent aucun résultat.
      </p>
    </div>
  );
}

function SeeMoreButton({ onClick, remaining }: { onClick: () => void; remaining: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl border border-[rgba(53,231,90,0.18)] bg-[rgba(53,231,90,0.06)] text-sm font-extrabold text-[#35E75A] transition-colors hover:bg-[rgba(53,231,90,0.10)]"
    >
      Voir plus ({remaining})
    </button>
  );
}

function SmartHero({
  selectedDay,
  onSelectDay,
}: {
  selectedDay: SelectedDay;
  onSelectDay: (day: SelectedDay) => void;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-[28px] border border-[rgba(53,231,90,0.14)] bg-[#07131c] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8 lg:min-h-[330px] lg:px-10 lg:py-9">
      <img
        src="/stadium-night.jpg"
        alt=""
        className="absolute inset-0 -z-30 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,12,18,0.88)_0%,rgba(5,12,18,0.68)_36%,rgba(5,12,18,0.36)_62%,rgba(5,12,18,0.20)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_78%,rgba(52,231,90,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(73,181,255,0.10),transparent_26%)]" />

      <div className="relative max-w-[780px]">
        <div className="mb-4 flex items-center sm:mb-5">
          <Logo className="h-auto w-[160px] object-contain sm:w-[210px]" />
        </div>
        <span className="mb-4 inline-flex h-[28px] w-fit items-center rounded-full border border-[rgba(53,231,90,0.28)] bg-[rgba(5,11,18,0.36)] px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand sm:mb-5 sm:h-[34px] sm:px-4 sm:text-xs sm:tracking-[0.22em]">
          Smart Sim
        </span>
        <h1 className="text-3xl font-extrabold leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-[64px] lg:tracking-[-0.06em]">
          Sélections Smart Sim
        </h1>
        <p className="mt-3 max-w-[760px] text-sm leading-[1.5] text-[rgba(220,230,235,0.72)] sm:mt-5 sm:text-lg sm:leading-[1.55] md:text-[20px]">
          Nos avis du jour, organisés en deux lectures simples : résultat du match et plus de 2,5 buts.
        </p>
      </div>

      <DateSelector selectedDay={selectedDay} onSelectDay={onSelectDay} />
    </header>
  );
}

function DateSelector({
  selectedDay,
  onSelectDay,
}: {
  selectedDay: SelectedDay;
  onSelectDay: (day: SelectedDay) => void;
}) {
  return (
    <div className="mt-5 flex h-11 w-fit items-center gap-1 rounded-full border border-white/10 bg-[rgba(4,11,17,0.72)] p-1 backdrop-blur-xl sm:mt-7 lg:absolute lg:bottom-6 lg:right-6 lg:mt-0">
      <CalendarDays size={16} className="ml-2 text-[#35E75A]" />
      {[
        { value: "today" as const, label: "Aujourd'hui" },
        { value: "tomorrow" as const, label: "Demain" },
      ].map((item) => {
        const active = selectedDay === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelectDay(item.value)}
            className={`h-9 rounded-full border px-3 text-[12px] font-extrabold transition-colors sm:px-4 sm:text-[13px] ${
              active
                ? "border-[rgba(53,231,90,0.28)] bg-[rgba(53,231,90,0.18)] text-[#35E75A]"
                : "border-transparent bg-transparent text-[rgba(243,246,247,0.62)] hover:bg-white/[0.04] hover:text-[#F3F6F7]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function SelectionPanel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[rgba(53,231,90,0.14)] bg-[rgba(7,16,24,0.82)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:rounded-[26px] sm:p-[22px]">
      <div className="mb-4 flex items-center gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(53,231,90,0.24)] bg-[rgba(53,231,90,0.10)] text-[#35E75A] sm:h-14 sm:w-14">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight tracking-[-0.03em] text-[#F3F6F7] sm:text-[25px] sm:tracking-[-0.04em]">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-snug text-[rgba(243,246,247,0.64)] sm:text-sm">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PanelMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[rgba(5,12,18,0.58)] px-4 py-6 text-sm font-medium text-[rgba(243,246,247,0.58)]">
      {children}
    </div>
  );
}
