import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { Logo } from "./Logo";

export function HomeHero({
  matchCount,
  smartCount,
  leagueCount: _leagueCount,
}: {
  matchCount: number;
  smartCount: number;
  leagueCount: number;
}) {
  return (
    <section className="relative isolate min-h-[400px] overflow-hidden rounded-[32px] border border-[rgba(80,255,150,0.12)] bg-[#07131c] px-12 py-11 shadow-[0_14px_40px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <img
        src="/stadium-night.jpg"
        alt=""
        className="absolute inset-0 -z-30 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,12,18,0.88)_0%,rgba(5,12,18,0.68)_36%,rgba(5,12,18,0.36)_62%,rgba(5,12,18,0.20)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_78%,rgba(52,231,90,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(73,181,255,0.10),transparent_26%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="max-w-[720px]">
          <div className="mb-4 flex items-center">
            <Logo className="h-auto w-[210px] object-contain" />
          </div>
          <span className="mb-4 inline-flex h-[34px] w-fit items-center rounded-full border border-[rgba(53,231,90,0.28)] bg-[rgba(5,11,18,0.36)] px-4 text-xs font-extrabold uppercase tracking-[0.22em] text-brand">
            Smart football
          </span>
          <h1 className="text-5xl font-extrabold leading-[0.93] tracking-[-0.06em] text-white md:text-6xl lg:text-[66px]">
            Bienvenue sur
            <br />
            <span className="text-brand">Smart Sim</span>
          </h1>
          <p className="mt-3 max-w-[640px] text-lg leading-[1.48] text-[rgba(220,230,235,0.72)] md:text-[20px]">
            Retrouvez les meilleures analyses football du jour, propulsées par
            nos modèles statistiques.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3.5">
            <Link
              href="/smart-sim"
              className="group inline-flex h-12 items-center gap-2 rounded-[14px] bg-[#F5C542] px-5 text-sm font-extrabold text-[#0B0F14] shadow-[0_8px_24px_rgba(245,197,66,0.22)] transition-colors hover:bg-[#FFD45A]"
            >
              <Sparkles size={14} strokeWidth={2.5} />
              Voir Smart Sim
              <ChevronRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/matches"
              className="group inline-flex h-12 items-center gap-2 rounded-[14px] border border-[#2A3340] bg-black/20 px-5 text-sm font-bold text-white transition-colors hover:border-brand/25 hover:bg-white/[0.055]"
            >
              Tous les matchs
              <ChevronRight
                size={16}
                className="text-fg-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          </div>

        </div>

        <div className="flex max-w-[500px] items-center gap-8">
          <HeroStat icon={<CalendarDays size={28} />} value={matchCount} label="matchs du jour" />
          <div className="h-14 w-px bg-white/10" />
          <HeroStat icon={<TrendingUp size={28} />} value={smartCount} label="Smart Sim" />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 text-brand">
      <span className="text-brand">{icon}</span>
      <div>
        <div className="text-[36px] font-extrabold leading-none text-brand">{value}</div>
        <div className="mt-1 text-sm font-medium text-[rgba(220,230,235,0.72)]">
          {label}
        </div>
      </div>
    </div>
  );
}
