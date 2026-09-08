import { Activity, CircleDot, MapPin, Swords } from "lucide-react";
import type { ReactNode } from "react";
import type { MatchDetail } from "@/lib/types";
import { isUpcoming, statusLabel } from "./matchUtils";

export function MatchContextCard({ match }: { match: MatchDetail }) {
  const hasForm = Boolean(match.form?.home?.length || match.form?.away?.length);
  const hasH2h = Boolean(match.h2h?.length);
  const contexts = [
    match.venue
      ? { icon: <MapPin size={22} />, title: "Stade", text: match.venue }
      : null,
    hasForm
      ? {
          icon: <Activity size={22} />,
          title: "Forme récente",
          text: `${match.home_team.name} : ${match.form?.home?.join(" ") || "—"} · ${match.away_team.name} : ${match.form?.away?.join(" ") || "—"}`,
        }
      : null,
    hasH2h
      ? { icon: <Swords size={22} />, title: "Face-à-face", text: `${match.h2h.length} rencontre${match.h2h.length > 1 ? "s" : ""} disponible${match.h2h.length > 1 ? "s" : ""}` }
      : null,
  ].filter(Boolean) as Array<{ icon: ReactNode; title: string; text: string }>;

  if (!contexts.length || (contexts.length === 1 && contexts[0].title === "Stade")) return null;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[rgba(7,16,24,0.82)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:rounded-3xl sm:p-5 lg:p-6 xl:col-span-2">
      <h2 className="mb-3 text-base font-black tracking-[-0.02em] text-[#F3F6F7] sm:text-lg lg:text-xl">Contexte du match</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {contexts.map((item) => (
          <div key={item.title} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5C542]/10 text-[#F5C542]">
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="font-black text-[#F3F6F7]">{item.title}</div>
              <div className="mt-1 truncate text-sm font-medium text-[rgba(243,246,247,0.62)]">{item.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
