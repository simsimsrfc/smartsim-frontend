// Central admin check — single source of truth
const ADMIN_EMAILS = new Set([
  "s.floret35@gmail.com",
]);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}
