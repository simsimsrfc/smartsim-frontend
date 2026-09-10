"use client";
import { useEffect, useState } from "react";
import { Wallet, Save, Check } from "lucide-react";
import { api } from "@/lib/api";

export function BankrollSection({ userEmail }: { userEmail: string }) {
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("EUR");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const b = await api.getBankroll(userEmail);
        if (cancelled) return;
        setAmount(b.amount > 0 ? String(b.amount) : "");
        setCurrency(b.currency || "EUR");
        setStatus("idle");
      } catch (e) {
        if (!cancelled) { setStatus("error"); setErrMsg((e as Error).message.slice(0, 120)); }
      }
    })();
    return () => { cancelled = true; };
  }, [userEmail]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(amount);
    if (!Number.isFinite(val) || val < 0) return;
    setStatus("saving");
    try {
      await api.setBankroll(userEmail, val, currency);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    } catch (e) {
      setStatus("error");
      setErrMsg((e as Error).message.slice(0, 120));
    }
  }

  return (
    <section className="rounded-xl border border-soft bg-gradient-card shadow-card p-6 mb-5">
      <h2 className="text-fg text-base font-semibold mb-2 flex items-center gap-2">
        <Wallet size={18} className="text-brand" /> Gestion de bankroll
      </h2>
      <p className="mb-5 text-sm text-fg-muted max-w-lg">
        Renseigne ton capital total dédié aux paris. Les <strong className="text-[#B7A2FF]">★ Smart Sim Value</strong> afficheront alors la mise conseillée en €, calculée via Kelly fractionnaire (¼ Kelly, plafond 10% bankroll).
      </p>
      <form onSubmit={save} className="flex max-w-md items-end gap-3">
        <label className="flex-1">
          <div className="mb-1.5 text-xs uppercase tracking-wider text-fg-muted">Bankroll</div>
          <div className="flex h-11 items-center gap-2 rounded-md border border-soft bg-white/[0.025] px-3">
            <input
              inputMode="decimal"
              placeholder="Ex : 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(",", "."))}
              className="w-full bg-transparent text-sm text-fg placeholder-fg-muted/60 outline-none"
            />
            <span className="text-sm font-semibold text-fg-muted">{currency}</span>
          </div>
        </label>
        <label className="w-[104px]">
          <div className="mb-1.5 text-xs uppercase tracking-wider text-fg-muted">Devise</div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-11 w-full rounded-md border border-soft bg-white/[0.025] px-3 text-sm text-fg outline-none"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="CHF">CHF</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={status === "saving" || !amount}
          className="inline-flex h-11 items-center gap-1.5 rounded-md border border-brand/30 bg-brand/10 px-4 text-sm font-bold text-brand transition-colors hover:bg-brand/20 disabled:opacity-40"
        >
          {status === "saved" ? <><Check size={16} /> Enregistré</> : <><Save size={16} /> Enregistrer</>}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-3 text-xs text-danger">Erreur : {errMsg}</p>
      )}
    </section>
  );
}
