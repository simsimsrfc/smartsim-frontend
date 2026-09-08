import type { Team } from "@/lib/types";
import { teamLogoProps } from "./matchUtils";

export function TeamLogo({ team, size = "small" }: { team: Team; size?: "small" | "hero" }) {
  const { className, initials } = teamLogoProps(team, size);
  const logo = team.logo?.trim();

  if (logo) {
    return (
      <img
        src={logo}
        alt={team.name}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={`${className} relative z-10 shrink-0 object-contain drop-shadow-lg`}
      />
    );
  }

  return (
    <span className={`${className} relative z-10 flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-black text-[#F3F6F7]`}>
      {initials}
    </span>
  );
}
