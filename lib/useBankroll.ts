"use client";
import { useEffect, useState } from "react";
import { api } from "./api";
import { isAdmin } from "./admin";

// Cache module-level pour éviter re-fetch entre cartes
let _cached: { amount: number; currency: string; email: string } | null = null;
let _inflight: Promise<void> | null = null;
const _subs = new Set<() => void>();

export function useBankroll(userEmail: string | null | undefined) {
  const [state, setState] = useState(_cached);

  useEffect(() => {
    if (!userEmail || !isAdmin(userEmail)) return;
    const notify = () => setState(_cached);
    _subs.add(notify);
    if (_cached && _cached.email === userEmail) { notify(); return () => void _subs.delete(notify); }
    if (!_inflight) {
      _inflight = api.getBankroll(userEmail).then((b) => {
        _cached = { amount: b.amount || 0, currency: b.currency || "EUR", email: userEmail };
        _subs.forEach((fn) => fn());
      }).catch(() => { /* silent */ }).finally(() => { _inflight = null; });
    }
    return () => void _subs.delete(notify);
  }, [userEmail]);

  return state; // { amount, currency, email } or null
}

export function invalidateBankroll() { _cached = null; _subs.forEach((fn) => fn()); }
