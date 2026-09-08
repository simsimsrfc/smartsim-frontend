import type { MatchSummary } from "@/lib/types";
import { MatchRow } from "./MatchRow";

export function LeagueSection({
  name,
  matches,
  delay = 0,
}: {
  name: string;
  matches: MatchSummary[];
  delay?: number;
}) {
  const flag = matches[0]?.league.flag;
  const country = matches[0]?.league.country;

  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="mb-6 overflow-hidden rounded-[28px] border border-[rgba(130,170,150,0.16)] bg-[rgba(10,18,24,0.76)] shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <header className="relative flex h-[80px] items-center justify-between border-b border-[rgba(130,170,150,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(53,231,90,0.035))] px-6">
        <div className="relative flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[rgba(130,170,150,0.16)] bg-white/[0.035] text-[22px]">
              {flag || "L"}
            </span>
            <div className="min-w-0">
              <h3 className="text-[22px] font-extrabold leading-tight tracking-[-0.035em] text-fg">
                {name}
              </h3>
              {country && country !== name && (
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                  {country}
                </div>
              )}
            </div>
          </div>
          <span className="inline-flex h-[34px] shrink-0 items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.10] px-3.5 text-[13px] font-extrabold text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {matches.length} match{matches.length > 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-2.5 p-3">
        {matches.map((m) => (
          <div key={m.fixture_id}>
            <MatchRow match={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
