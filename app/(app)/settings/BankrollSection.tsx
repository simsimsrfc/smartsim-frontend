"use client";
import { Wallet } from "lucide-react";
import { BankrollControl } from "@/components/bankroll/BankrollControl";

export function BankrollSection({ userEmail }: { userEmail: string }) {
  return (
    <section className="rounded-xl border border-soft bg-gradient-card shadow-card p-6 mb-5">
      <h2 className="text-fg text-base font-semibold mb-2 flex items-center gap-2">
        <Wallet size={18} className="text-brand" /> Gestion de bankroll
      </h2>
      <p className="mb-5 text-sm text-fg-muted max-w-lg">
        Renseigne ton capital total dédié aux paris. Les <strong className="text-[#B7A2FF]">★ Smart Sim Value</strong> afficheront alors la mise conseillée en €, calculée via Kelly fractionnaire (¼ Kelly, plafond 10% bankroll).
      </p>
      <BankrollControl userEmail={userEmail} />
    </section>
  );
}
