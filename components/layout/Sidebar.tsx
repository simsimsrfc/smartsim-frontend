"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, CalendarDays, Star, History, Settings, LogOut } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/smart-sim", label: "Smart Sim", icon: Activity },
  { href: "/matches", label: "Tous les matchs", icon: CalendarDays },
  { href: "/favorites", label: "Favoris", icon: Star },
  { href: "/history", label: "Historique", icon: History },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

type Props = { userEmail?: string | null };

export function Sidebar({ userEmail }: Props) {
  const pathname = usePathname();
  const initial = (userEmail?.[0] || "?").toUpperCase();
  const displayName = userEmail?.split("@")[0] || "Utilisateur";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col overflow-hidden border-r border-[rgba(130,170,150,0.12)] bg-[#050B12] lg:flex">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#050B12_0%,#071019_38%,#08121A_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(180deg,rgba(5,11,18,0)_0%,rgba(15,90,53,0.22)_48%,rgba(21,115,71,0.34)_100%),url('/stadium-night.jpg')] bg-cover bg-[position:left_bottom] bg-no-repeat opacity-80 [mask-image:linear-gradient(180deg,transparent_0%,black_30%,black_100%)]" />
      <div className="pointer-events-none absolute -bottom-24 -left-28 h-[360px] w-[360px] rounded-full bg-[#157347]/45 blur-[70px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[220px] w-full bg-[radial-gradient(circle_at_28%_88%,rgba(53,231,90,0.22),rgba(31,168,91,0.12)_34%,transparent_68%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,transparent,rgba(53,231,90,0.18),transparent)]" />
      <div className="relative border-b border-white/[0.07] px-6 pb-[22px] pt-6">
        <div className="flex items-center text-fg">
          <Logo className="h-auto w-[190px] object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-2.5 overflow-hidden px-3.5 py-[18px]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex h-[52px] items-center gap-3 rounded-full px-3.5 text-[15px] font-semibold transition-all duration-200",
                active
                  ? "border border-brand/30 bg-[rgba(21,115,71,0.28)] text-fg shadow-[inset_0_0_0_1px_rgba(53,231,90,0.04)]"
                  : "border border-transparent text-fg/60 hover:bg-white/[0.035] hover:text-fg"
              )}
            >
              <span className={clsx(
                "flex h-[34px] w-[34px] items-center justify-center rounded-full transition-colors",
                active ? "bg-brand text-[#031008]" : "bg-white/[0.045] text-fg/60 group-hover:text-fg"
              )}>
                <Icon size={17} strokeWidth={2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile + logout */}
      <div className="relative m-4 mt-auto space-y-2 rounded-[18px] border border-[rgba(130,170,150,0.16)] bg-[rgba(5,11,18,0.62)] p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand text-bg-app font-black flex items-center justify-center text-sm shrink-0 shadow-[0_0_20px_rgba(53,231,90,0.25)]">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-fg text-sm font-semibold truncate capitalize">{displayName}</div>
            <div className="text-fg-muted text-xs truncate">{userEmail || "Non connecté"}</div>
          </div>
        </div>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 h-10 rounded-2xl text-xs font-bold text-fg-secondary hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
