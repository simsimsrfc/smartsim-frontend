"use client";
import { useEffect, useState } from "react";
import { api } from "./api";
import { isAdmin } from "./admin";

// Module-level cache + pub/sub so every card re-renders as soon as the bankroll changes,
// without needing a page reload or an extra network round-trip.
type CacheShape = { amount: number; currency: string; email: string } | null;

let _cached: CacheShape = null;
let _inflight: Promise<void> | null = null;
const _subs = new Set<(v: CacheShape) => void>();

function notifyAll() {
  _subs.forEach((fn) => fn(_cached));
}

export function useBankroll(userEmail: string | null | undefined) {
  const [state, setState] = useState<CacheShape>(_cached);

  useEffect(() => {
    if (!userEmail || !isAdmin(userEmail)) return;
    const notify = (v: CacheShape) => setState(v);
    _subs.add(notify);
    // Cache hit for this user → publish now
    if (_cached && _cached.email === userEmail) {
      notify(_cached);
      return () => void _subs.delete(notify);
    }
    // Otherwise fetch (deduped)
    if (!_inflight) {
      _inflight = api.getBankroll(userEmail).then((b) => {
        _cached = { amount: b.amount || 0, currency: b.currency || "EUR", email: userEmail };
        notifyAll();
      }).catch(() => { /* silent */ }).finally(() => { _inflight = null; });
    }
    return () => void _subs.delete(notify);
  }, [userEmail]);

  return state;
}

// Called after a successful POST /bankroll — push the new value directly into the cache
// so every subscriber updates without waiting for a re-fetch.
export function primeBankroll(email: string, amount: number, currency: string) {
  _cached = { amount, currency, email };
  notifyAll();
}

// Discards the cache AND immediately refetches for the given user.
// Kept for edge cases (auth switch) — everyday saves should use primeBankroll instead.
export function invalidateBankroll(userEmail?: string) {
  _cached = null;
  if (userEmail) {
    _inflight = api.getBankroll(userEmail).then((b) => {
      _cached = { amount: b.amount || 0, currency: b.currency || "EUR", email: userEmail };
      notifyAll();
    }).catch(() => { notifyAll(); }).finally(() => { _inflight = null; });
  } else {
    notifyAll();
  }
}
