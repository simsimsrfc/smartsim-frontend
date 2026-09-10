// Formats de dates/heures forcés en Europe/Paris pour cohérence entre le
// scheduler (backend) qui définit "today" en Paris et l'affichage utilisateur.

const PARIS_TZ = "Europe/Paris";

export function formatTimeParis(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", timeZone: PARIS_TZ,
    });
  } catch {
    return "—";
  }
}

export function formatDateParis(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { ...opts, timeZone: PARIS_TZ });
  } catch {
    return "—";
  }
}

export function formatShortDateParis(iso: string): string {
  return formatDateParis(iso, { day: "2-digit", month: "short", year: "numeric" });
}
