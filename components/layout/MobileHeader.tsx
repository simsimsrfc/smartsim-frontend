"use client";
import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { Logo } from "./Logo";

/**
 * Header mobile/tablette (< lg). Sticky en haut, garde l'identité dark/green
 * de la sidebar desktop. Logo Smart Sim compact à gauche, accès Paramètres
 * en icône discrète à droite. Respecte env(safe-area-inset-top).
 */
export function MobileHeader() {
  return (
    <header
      className="
        sticky top-0 z-30 lg:hidden
        border-b border-[rgba(130,170,150,0.14)]
        bg-[rgba(5,11,18,0.88)] backdrop-blur-xl
        pt-[max(env(safe-area-inset-top),0px)]
      "
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-4">
        <Link href="/" className="flex items-center" aria-label="Smart Sim">
          <Logo className="h-auto w-[120px] object-contain" />
        </Link>
        <Link
          href="/settings"
          aria-label="Paramètres"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-fg/70 transition-colors hover:bg-white/[0.1] hover:text-fg"
        >
          <SettingsIcon size={16} strokeWidth={2.2} />
        </Link>
      </div>
    </header>
  );
}
