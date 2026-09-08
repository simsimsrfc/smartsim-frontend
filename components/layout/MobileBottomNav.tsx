"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, CalendarDays, Star, History } from "lucide-react";
import clsx from "clsx";

/**
 * Bottom navigation mobile/tablette (< lg).
 * Reprend l'identité visuelle de la sidebar desktop : fond dark glassmorphism,
 * bordure subtile, accent vert sur l'onglet actif, icônes Lucide.
 * Respecte env(safe-area-inset-bottom) pour iPhone.
 */
const NAV_ITEMS = [
  { href: "/",          label: "Accueil",   icon: Home },
  { href: "/smart-sim", label: "Smart Sim", icon: Activity },
  { href: "/matches",   label: "Matchs",    icon: CalendarDays },
  { href: "/favorites", label: "Favoris",   icon: Star },
  { href: "/history",   label: "Historique", icon: History },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-40 lg:hidden
        border-t border-[rgba(130,170,150,0.16)]
        bg-[rgba(5,11,18,0.92)] backdrop-blur-xl
        pb-[max(env(safe-area-inset-bottom),8px)] pt-2
        shadow-[0_-8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(53,231,90,0.06)]
      "
      role="navigation"
      aria-label="Navigation principale mobile"
    >
      <ul className="mx-auto flex max-w-[640px] items-stretch justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-[58px] flex-col items-center justify-center gap-1 rounded-2xl transition-colors",
                  active
                    ? "bg-[rgba(21,115,71,0.22)] text-brand"
                    : "text-fg/55 hover:text-fg"
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-brand text-[#031008] shadow-[0_0_18px_rgba(53,231,90,0.45)]"
                      : "bg-white/[0.045]"
                  )}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <span className="text-[10.5px] font-bold leading-none tracking-[0.02em]">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
