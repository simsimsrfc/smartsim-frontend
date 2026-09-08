// Header de page réutilisable : titre + sous-titre + slot droite (filtres, actions)
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  eyebrow?: string;
  variant?: "green" | "gold";
};

export function PageHeader({ title, subtitle, right, eyebrow, variant = "green" }: Props) {
  const accent =
    variant === "gold"
      ? "text-bg-app bg-gradient-to-br from-gold to-[#D9A91F] shadow-[0_8px_22px_rgba(245,197,66,0.24)]"
      : "text-brand bg-brand/10 border border-green/40";

  return (
    <header className="premium-panel px-7 py-7 md:px-8 md:py-8">
      <div className="relative z-10 flex items-end justify-between gap-5 flex-wrap">
      <div>
        {eyebrow && (
          <span className={`mb-4 inline-flex rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] ${accent}`}>
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-black tracking-normal text-fg leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-fg-secondary mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {right}
      </div>
    </header>
  );
}
