"use client";
import { useEffect, useState } from "react";
import { Wallet, Check } from "lucide-react";
import { api } from "@/lib/api";
import { primeBankroll } from "@/lib/useBankroll";

type Props = {
  userEmail: string;
  compact?: boolean;
  label?: string;
};

export function BankrollControl({ userEmail, compact = false, label = "Bankroll" }: Props) {
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("EUR");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await api.getBankroll(userEmail);
        if (cancelled) return;
        setAmount(b.amount > 0 ? String(b.amount) : "");
        setCurrency(b.currency || "EUR");
      } catch { /* silent */ }
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
      primeBankroll(userEmail, val, currency);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch { setStatus("error"); }
  }

  if (compact) {
    return (
      <form onSubmit={save} className="flex items-center gap-2 rounded-full border border-[rgba(123,92,255,0.32)] bg-[rgba(123,92,255,0.08)] px-3 py-1.5">
        <Wallet size={14} className="text-[#B7A2FF]" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#B7A2FF]">{label}</span>
        <input
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(",", "."))}
          className="w-16 bg-transparent text-sm font-bold text-fg outline-none"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="bg-transparent text-xs font-semibold text-fg-muted outline-none"
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="CHF">CHF</option>
        </select>
        <button
          type="submit"
          disabled={status === "saving" || !amount}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-[#7B5CFF] px-2.5 text-[11px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {status === "saved" ? <><Check size={12} /> OK</> : "OK"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={save} className="flex max-w-md items-end gap-3">
      <label className="flex-1">
        <div className="mb-1.5 text-xs uppercase tracking-wider text-fg-muted">{label}</div>
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
        {status === "saved" ? <><Check size={16} /> Enregistré</> : "Enregistrer"}
      </button>
    </form>
  );
}
