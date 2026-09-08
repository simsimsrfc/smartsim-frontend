import { Sparkles, AlertTriangle, Target, Activity } from "lucide-react";
import type { MatchInsights } from "@/lib/types";

/**
 * Phase 2 — Carte résumé intelligent du match.
 * S'affiche uniquement si `match.insights` est présent (fallback-safe).
 *
 * Contient :
 *   - smart_summary (phrase courte professionnelle)
 *   - best_market (marché le plus fort)
 *   - risk_level
 *   - match_profile
 *
 * Mobile-first : padding sobre, tailles fluides, pas de bloc énorme.
 */
const RISK_COLOR: Record<string, string> = {
  faible: "text-[#35E75A] border-[#35E75A]/30 bg-[#35E75A]/[0.08]",
  moyen:  "text-[#F5C542] border-[#F5C542]/30 bg-[#F5C542]/[0.08]",
  élevé:  "text-[#FF6B6B] border-[#FF6B6B]/30 bg-[#FF6B6B]/[0.08]",
};

const BEST_MARKET_LABEL: Record<string, string> = {
  over_15: "Over 1.5",
  over_25: "Over 2.5",
  btts:    "BTTS",
  winner:  "Résultat",
};

const PROFILE_LABEL: Record<string, string> = {
  favori_clair:      "Favori clair",
  favori_leger:      "Léger favori",
  match_ouvert:      "Match ouvert",
  risque_nul:        "Risque de nul",
  balanced:          "Match équilibré",
  match_equilibre:   "Match équilibré",
  profil_offensif:   "Profil offensif",
  profil_prudent:    "Profil prudent",
};

export function SmartSummaryCard({ insights }: { insights: MatchInsights | null | undefined }) {
  if (!insights) return null;

  const { summary } = insights;
  const riskClass = RISK_COLOR[summary.risk_level] || RISK_COLOR.moyen;
  const bestLabel = summary.best_market ? BEST_MARKET_LABEL[summary.best_market] : null;
  const profileLabel = PROFILE_LABEL[summary.match_profile] || summary.match_profile;

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(7,16,24,0.86)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:rounded-3xl sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(53,231,90,0.08),transparent_40%)]" />

      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#35E75A]/12 text-[#35E75A]">
          <Sparkles size={18} strokeWidth={2.4} />
        </span>
        <h2 className="text-base font-black tracking-[-0.02em] text-[#F3F6F7] sm:text-lg lg:text-xl">
          Lecture du match
        </h2>
      </div>

      <p className="text-sm font-medium leading-relaxed text-[rgba(243,246,247,0.82)] sm:text-[15px] lg:text-base">
        {summary.smart_summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {bestLabel && (
          <Badge icon={<Target size={13} />} label="Marché fort" value={bestLabel} accent="green" />
        )}
        <Badge
          icon={<AlertTriangle size={13} />}
          label="Risque"
          value={summary.risk_level}
          accentClass={riskClass}
        />
        <Badge icon={<Activity size={13} />} label="Profil" value={profileLabel} accent="neutral" />
      </div>
    </section>
  );
}

function Badge({
  icon,
  label,
  value,
  accent,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "green" | "neutral";
  accentClass?: string;
}) {
  const base =
    accentClass ||
    (accent === "green"
      ? "text-[#35E75A] border-[#35E75A]/30 bg-[#35E75A]/[0.08]"
      : "text-[rgba(243,246,247,0.78)] border-white/[0.10] bg-white/[0.03]");
  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold uppercase tracking-[0.06em] ${base}`}
    >
      {icon}
      <span className="opacity-70">{label}</span>
      <span className="capitalize">{value}</span>
    </span>
  );
}
