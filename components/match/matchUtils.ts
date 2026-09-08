import type { MatchDetail, MatchSummary, Team } from "@/lib/types";

const TEAM_LOGO_FALLBACK: Record<string, string> = {
  Frosinone: "https://media.api-sports.io/football/teams/512.png",
  Mantova: "https://media.api-sports.io/football/teams/1693.png",
  Lens: "https://media.api-sports.io/football/teams/116.png",
  Nantes: "https://media.api-sports.io/football/teams/83.png",
  "SC Paderborn 07": "https://media.api-sports.io/football/teams/185.png",
  "Karlsruher SC": "https://media.api-sports.io/football/teams/785.png",
  Pescara: "https://media.api-sports.io/football/teams/525.png",
  Spezia: "https://media.api-sports.io/football/teams/515.png",
  "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png",
  "Eintracht Frankfurt": "https://media.api-sports.io/football/teams/169.png",
  Venezia: "https://media.api-sports.io/football/teams/517.png",
  Palermo: "https://media.api-sports.io/football/teams/522.png",
  Catanzaro: "https://media.api-sports.io/football/teams/1687.png",
  Bari: "https://media.api-sports.io/football/teams/508.png",
  Reggiana: "https://media.api-sports.io/football/teams/880.png",
  Sampdoria: "https://media.api-sports.io/football/teams/498.png",
  "Hull City": "https://media.api-sports.io/football/teams/64.png",
  Millwall: "https://media.api-sports.io/football/teams/58.png",
  "Virtus Entella": "https://media.api-sports.io/football/teams/527.png",
  Carrarese: "https://media.api-sports.io/football/teams/1581.png",
  Torino: "https://media.api-sports.io/football/teams/503.png",
  Monza: "https://media.api-sports.io/football/teams/1579.png",
  Empoli: "https://media.api-sports.io/football/teams/511.png",
  "1. FC Kaiserslautern": "https://media.api-sports.io/football/teams/745.png",
  "Arminia Bielefeld": "https://media.api-sports.io/football/teams/188.png",
  Cesena: "https://media.api-sports.io/football/teams/509.png",
  Padova: "https://media.api-sports.io/football/teams/870.png",
  Sudtirol: "https://media.api-sports.io/football/teams/1578.png",
  "Juve Stabia": "https://media.api-sports.io/football/teams/863.png",
  Osasuna: "https://media.api-sports.io/football/teams/727.png",
  "Standard Liege": "https://media.api-sports.io/football/teams/733.png",
  Villefranche: "https://media.api-sports.io/football/teams/1302.png",
  Ajaccio: "https://media.api-sports.io/football/teams/98.png",
  Avellino: "https://media.api-sports.io/football/teams/528.png",
  Modena: "https://media.api-sports.io/football/teams/899.png",
};

const COUNTRY_BY_LEAGUE: Record<string, string> = {
  "ligue 1": "France",
  "ligue 2": "France",
  "serie a": "Italie",
  "serie b": "Italie",
  bundesliga: "Allemagne",
  "2. bundesliga": "Allemagne",
  laliga: "Espagne",
  "la liga": "Espagne",
  "premier league": "Angleterre",
  championship: "Angleterre",
  eredivisie: "Pays-Bas",
  "liga portugal": "Portugal",
  "primeira liga": "Portugal",
  "süper lig": "Turquie",
  "super lig": "Turquie",
  hnl: "Croatie",
};

export function formatProbability(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function confidenceLabel(value: number | null): string {
  if (value === null) return "Indisponible";
  if (value >= 0.75) return "Très forte";
  if (value >= 0.65) return "Forte";
  if (value >= 0.55) return "Correcte";
  return "Modérée";
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function isUpcoming(match: MatchDetail): boolean {
  const code = match.status?.code?.toUpperCase();
  return !code || ["NS", "TBD", "PST", "SUSP"].includes(code);
}

export function statusLabel(match: MatchDetail): string {
  const code = match.status?.code?.toUpperCase();
  if (code === "FT" || code === "AET" || code === "PEN") return "Terminé";
  if (code === "1H" || code === "2H" || code === "HT") return "En cours";
  return "À venir";
}

export function getTeamInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !["FC", "SC", "CF", "AC", "AS", "AFC", "RC", "HNK", "1", "07", "CLUB", "FOOTBALL"].includes(word.toUpperCase()));

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] || name).slice(0, 2).toUpperCase();
}

export function teamLogoProps(team: Team, size: "small" | "hero" = "small") {
  const className = size === "hero" ? "h-[74px] w-[74px] md:h-[86px] md:w-[86px]" : "h-8 w-8";
  return { className, initials: getTeamInitials(team.name) };
}

export function teamLogoFromMatchesMapping(team: Team): string {
  return team.logo?.trim() || TEAM_LOGO_FALLBACK[team.name] || "";
}

export function inferCountryFromLeague(leagueName?: string, country?: string): string {
  if (country?.trim()) return country.trim();
  const key = normalizeText(leagueName || "");
  return COUNTRY_BY_LEAGUE[key] || "";
}

export function normalizeMatchForAnalysis(match: MatchDetail): MatchDetail {
  const raw = match as MatchDetail & {
    homeTeam?: MatchSummary["home_team"];
    awayTeam?: MatchSummary["away_team"];
    home?: MatchSummary["home_team"];
    away?: MatchSummary["away_team"];
    teams?: { home?: MatchSummary["home_team"]; away?: MatchSummary["away_team"] };
  };

  const home = raw.home_team || raw.homeTeam || raw.home || raw.teams?.home || { id: null, name: "", logo: "" };
  const away = raw.away_team || raw.awayTeam || raw.away || raw.teams?.away || { id: null, name: "", logo: "" };
  const normalizedHome = {
    id: home.id ?? null,
    name: home.name || "",
    logo: teamLogoFromMatchesMapping({
      id: home.id ?? null,
      name: home.name || "",
      logo: home.logo || "",
    }),
  };
  const normalizedAway = {
    id: away.id ?? null,
    name: away.name || "",
    logo: teamLogoFromMatchesMapping({
      id: away.id ?? null,
      name: away.name || "",
      logo: away.logo || "",
    }),
  };

  return {
    ...match,
    league: {
      ...match.league,
      country: inferCountryFromLeague(match.league?.name, match.league?.country),
    },
    home_team: normalizedHome,
    away_team: normalizedAway,
  };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
