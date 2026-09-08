"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MatchSummary } from "./types";

export type FavoriteSource = "matches" | "smart-over25" | "smart-result";
export type FavoriteAnalysisType = "smart-over25" | "smart-result" | "over25" | "result" | "over15" | "btts";

export type FavoriteRecord = {
  favoriteKey: string;
  fixture_id: string;
  target_id: string;
  favoriteType: FavoriteAnalysisType;
  source: FavoriteSource;
  tab?: "recommendations" | "over25" | "result" | "over15" | "btts";
  createdAt: string;
  id: number;
  fav_type: "match";
  label: string;
  league_name: string;
  home_team: MatchSummary["home_team"];
  away_team: MatchSummary["away_team"];
  league: MatchSummary["league"];
  date: string;
  venue: string;
  status: MatchSummary["status"];
  probabilities: MatchSummary["probabilities"];
  predicted_winner: string;
  winner_proba: number;
  is_smart_bet: boolean;
  odds?: MatchSummary["odds"];
  match: MatchSummary;
};

export type FavoritePayload = {
  match: MatchSummary;
  source: FavoriteSource;
  tab?: "recommendations" | "over25" | "result" | "over15" | "btts";
  analysisType: FavoriteAnalysisType;
};

const STORAGE_KEY = "smartsim:favorites";
const FAVORITES_CHANGED_EVENT = "smartsim:favorites-changed";

export function getFavoriteKey(fixtureId: string, favoriteType: FavoriteAnalysisType): string {
  return `${fixtureId}:${favoriteType}`;
}

export const favoriteKey = getFavoriteKey;

export function favoriteFixtureId(favorite: Pick<FavoriteRecord, "fixture_id" | "target_id">): string {
  return String(favorite.fixture_id || favorite.target_id).split(":")[0];
}

export function favoriteTypeFromRecord(favorite: Pick<FavoriteRecord, "favoriteType" | "target_id">): FavoriteAnalysisType | string {
  return favorite.favoriteType || String(favorite.target_id).split(":")[1] || "";
}

export function readFavorites(): FavoriteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isFavoriteRecord) : [];
  } catch {
    return [];
  }
}

export function writeFavorites(favorites: FavoriteRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function listFavorites(): Promise<FavoriteRecord[]> {
  return Promise.resolve(readFavorites());
}

export function hydrateFavoriteMeta(favorites: FavoriteRecord[]): FavoriteRecord[] {
  return favorites;
}

export function createFavorite(payload: FavoritePayload): FavoriteRecord {
  const favoriteKey = getFavoriteKey(String(payload.match.fixture_id), payload.analysisType);
  const tab = payload.tab || (payload.source === "matches" ? "over25" : "recommendations");

  return {
    favoriteKey,
    fixture_id: String(payload.match.fixture_id),
    target_id: favoriteKey,
    favoriteType: payload.analysisType,
    source: payload.source,
    tab,
    createdAt: new Date().toISOString(),
    id: stableFavoriteId(favoriteKey),
    fav_type: "match",
    label: `${payload.match.home_team.name} vs ${payload.match.away_team.name}`,
    league_name: payload.match.league.name,
    home_team: payload.match.home_team,
    away_team: payload.match.away_team,
    league: payload.match.league,
    date: payload.match.date,
    venue: payload.match.venue,
    status: payload.match.status,
    probabilities: payload.match.probabilities,
    predicted_winner: payload.match.predicted_winner,
    winner_proba: payload.match.winner_proba,
    is_smart_bet: payload.match.is_smart_bet,
    odds: payload.match.odds,
    match: payload.match,
  };
}

export function addFavorite(payload: FavoritePayload): Promise<FavoriteRecord> {
  const favorite = createFavorite(payload);
  const favorites = readFavorites();
  if (!favorites.some((item) => item.favoriteKey === favorite.favoriteKey)) {
    writeFavorites([...favorites, favorite]);
  }
  return Promise.resolve(favorite);
}

export function removeFavorite(favoriteOrKey: Pick<FavoriteRecord, "favoriteKey"> | string): Promise<void> {
  const key = typeof favoriteOrKey === "string" ? favoriteOrKey : favoriteOrKey.favoriteKey;
  writeFavorites(readFavorites().filter((favorite) => favorite.favoriteKey !== key));
  return Promise.resolve();
}

export function toggleFavorite(payload: FavoritePayload): FavoriteRecord | null {
  const key = getFavoriteKey(String(payload.match.fixture_id), payload.analysisType);
  const favorites = readFavorites();
  const exists = favorites.some((favorite) => favorite.favoriteKey === key);
  if (exists) {
    writeFavorites(favorites.filter((favorite) => favorite.favoriteKey !== key));
    return null;
  }

  const favorite = createFavorite(payload);
  writeFavorites([...favorites, favorite]);
  return favorite;
}

export function findFavoriteForMatchType(
  favorites: FavoriteRecord[],
  fixtureId: string,
  favoriteType: FavoriteAnalysisType
): FavoriteRecord | null {
  const key = getFavoriteKey(String(fixtureId), favoriteType);
  return favorites.find((favorite) => favorite.favoriteKey === key) || null;
}

export function findFavoriteForMatch(favorites: FavoriteRecord[], fixtureId: string): FavoriteRecord | null {
  return favorites.find((favorite) => favorite.fixture_id === String(fixtureId)) || null;
}

export function isFavorite(favorites: FavoriteRecord[], fixtureId: string, favoriteType: FavoriteAnalysisType): boolean {
  return Boolean(findFavoriteForMatchType(favorites, fixtureId, favoriteType));
}

export function favoriteToMatch(favorite: FavoriteRecord): MatchSummary {
  return favorite.match || {
    fixture_id: favorite.fixture_id,
    league: favorite.league,
    date: favorite.date,
    venue: favorite.venue,
    status: favorite.status,
    score: { home: null, away: null },
    home_team: favorite.home_team,
    away_team: favorite.away_team,
    probabilities: favorite.probabilities,
    predicted_winner: favorite.predicted_winner,
    winner_proba: favorite.winner_proba,
    is_smart_bet: favorite.is_smart_bet,
    label: favorite.label,
    odds: favorite.odds || { over_25: null, over_15: null, btts: null },
  };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setFavorites(readFavorites());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(FAVORITES_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const add = useCallback((payload: FavoritePayload) => {
    const favorite = createFavorite(payload);
    const current = readFavorites();
    if (!current.some((item) => item.favoriteKey === favorite.favoriteKey)) {
      const next = [...current, favorite];
      writeFavorites(next);
      setFavorites(next);
    }
    return favorite;
  }, []);

  const remove = useCallback((favoriteKey: string) => {
    const next = readFavorites().filter((favorite) => favorite.favoriteKey !== favoriteKey);
    writeFavorites(next);
    setFavorites(next);
  }, []);

  const toggle = useCallback((payload: FavoritePayload) => {
    const key = getFavoriteKey(String(payload.match.fixture_id), payload.analysisType);
    const current = readFavorites();
    const exists = current.some((favorite) => favorite.favoriteKey === key);
    if (exists) {
      const next = current.filter((favorite) => favorite.favoriteKey !== key);
      writeFavorites(next);
      setFavorites(next);
      return null;
    }

    const nextFavorite = createFavorite(payload);
    const next = [...current, nextFavorite];
    writeFavorites(next);
    setFavorites(next);
    return nextFavorite;
  }, []);

  const check = useCallback(
    (fixtureId: string, favoriteType: FavoriteAnalysisType) => isFavorite(favorites, fixtureId, favoriteType),
    [favorites]
  );

  return useMemo(
    () => ({
      favorites,
      ready,
      addFavorite: add,
      removeFavorite: remove,
      toggleFavorite: toggle,
      isFavorite: check,
      getFavoriteKey,
    }),
    [add, check, favorites, ready, remove, toggle]
  );
}

function isFavoriteRecord(value: unknown): value is FavoriteRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<FavoriteRecord>;
  return Boolean(record.favoriteKey && record.fixture_id && record.favoriteType && record.home_team && record.away_team);
}

function stableFavoriteId(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
