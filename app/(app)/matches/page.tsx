import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";
import { MatchesInteractive } from "./MatchesInteractive";

export const revalidate = 30;
export const metadata = { title: "Tous les matchs — Smart Sim" };

export default async function MatchesPage() {
  let today: MatchSummary[] = [];
  let tomorrow: MatchSummary[] = [];
  let error: string | null = null;

  try {
    const [t, tm] = await Promise.all([
      api.matchesByDay("today").catch(() => ({ matches: [] as MatchSummary[] })),
      api.matchesByDay("tomorrow").catch(() => ({ matches: [] as MatchSummary[] })),
    ]);
    today = t.matches || [];
    tomorrow = tm.matches || [];
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
      <MatchesHero />
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 font-mono text-sm text-danger">{error}</div>
      )}
      {!error && <MatchesInteractive today={today} tomorrow={tomorrow} />}
    </div>
  );
}

function MatchesHero() {
  return (
    <header className="relative isolate min-h-[330px] overflow-hidden rounded-[32px] border border-[rgba(53,231,90,0.14)] bg-[#07131c] px-10 py-9 shadow-[0_14px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <img src="/stadium-night.jpg" alt="" className="absolute inset-0 -z-30 h-full w-full object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,12,18,0.88)_0%,rgba(5,12,18,0.68)_36%,rgba(5,12,18,0.38)_62%,rgba(5,12,18,0.24)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_78%,rgba(52,231,90,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(73,181,255,0.10),transparent_26%)]" />
      <div className="relative max-w-[720px]">
        <span className="mb-5 inline-flex h-[34px] w-fit items-center rounded-full border border-[rgba(53,231,90,0.28)] bg-[rgba(5,11,18,0.36)] px-4 text-xs font-extrabold uppercase tracking-[0.22em] text-brand">
          Tous les matchs
        </span>
        <h1 className="text-5xl font-extrabold leading-[0.95] tracking-[-0.06em] text-white md:text-6xl lg:text-[64px]">Tous les matchs</h1>
        <p className="mt-5 max-w-[680px] text-lg leading-[1.55] text-[rgba(220,230,235,0.72)] md:text-[20px]">
          Découvrez et analysez l'ensemble des matchs disponibles avec nos modèles statistiques avancés.
        </p>
        <Link
          href="/smart-sim"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-[14px] bg-[#F5C542] px-5 text-sm font-extrabold text-[#0B0F14] shadow-[0_8px_24px_rgba(245,197,66,0.22)] transition-colors hover:bg-[#FFD45A]"
        >
          <Sparkles size={14} strokeWidth={2.5} />
          Voir Smart Sim
          <ChevronRight size={16} />
        </Link>
      </div>
    </header>
  );
}
