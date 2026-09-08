"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function MatchDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(232,91,91,0.30)] bg-[rgba(232,91,91,0.08)] text-[#E85B5B]">
        <AlertTriangle size={26} />
      </div>
      <div>
        <h1 className="text-2xl font-black text-[#F3F6F7]">Ce match n'est pas affichable</h1>
        <p className="mt-2 text-sm font-medium text-[rgba(243,246,247,0.60)]">
          Une erreur s'est produite pendant l'analyse. Réessaie dans un instant ou retourne à la liste.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-xs text-[rgba(243,246,247,0.40)]">Digest : {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-[rgba(53,231,90,0.30)] bg-[rgba(53,231,90,0.10)] px-4 text-sm font-bold text-[#35E75A] hover:bg-[rgba(53,231,90,0.16)]"
        >
          Réessayer
        </button>
        <Link
          href="/matches"
          className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-white/[0.10] bg-white/[0.03] px-4 text-sm font-bold text-[#F3F6F7] hover:bg-white/[0.06]"
        >
          <ArrowLeft size={14} />
          Retour aux matchs
        </Link>
      </div>
    </div>
  );
}
