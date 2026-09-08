type CountryFlagProps = {
  country?: string | null;
  league?: string | null;
  flag?: string | null;
  className?: string;
};

// Mapping emoji drapeau → code ISO (utilisé par flagcdn.com / flagcdn.com/w40/<code>.png)
const EMOJI_TO_CODE: Record<string, string> = {
  "🇫🇷": "fr",
  "🇮🇹": "it",
  "🇩🇪": "de",
  "🇪🇸": "es",
  "🇬🇧": "gb",
  "🏴": "gb-eng",
  "🇳🇱": "nl",
  "🇵🇹": "pt",
  "🇧🇪": "be",
  "🇹🇷": "tr",
  "🇧🇷": "br",
  "🇦🇷": "ar",
  "🇺🇸": "us",
  "🇭🇷": "hr",
  "🇨🇭": "ch",
  "🇬🇷": "gr",
  "🇯🇵": "jp",
  "🇲🇽": "mx",
  "🇦🇺": "au",
  "🇸🇮": "si",
  "🇸🇰": "sk",
  "🏆": "eu",   // trophée → marqueur "Europe" (Champions/Europa/Conference League)
};

// Mapping noms de pays / ligues → codes ISO. Étendu pour toutes les ligues
// configurées côté backend (FR, EN, ES, IT, DE, NL, PT, BE, TR, CH, GR, JP,
// MX, AU, SI, SK, BR, HR + coupes européennes).
const TEXT_TO_CODE: Record<string, string> = {
  // ── FRANCE ──
  france: "fr",
  "ligue 1": "fr",
  "ligue 2": "fr",
  "national 1": "fr",
  // ── ITALY ──
  italy: "it",
  italie: "it",
  "serie a": "it",
  "serie b": "it",
  // ── GERMANY ──
  germany: "de",
  allemagne: "de",
  bundesliga: "de",
  "2. bundesliga": "de",
  // ── SPAIN ──
  spain: "es",
  espagne: "es",
  laliga: "es",
  "la liga": "es",
  "segunda division": "es",
  // ── ENGLAND ──
  england: "gb-eng",
  angleterre: "gb-eng",
  "premier league": "gb-eng",
  championship: "gb-eng",
  "league one": "gb-eng",
  "league two": "gb-eng",
  "national league": "gb-eng",
  // ── NETHERLANDS ──
  netherlands: "nl",
  "pays-bas": "nl",
  eredivisie: "nl",
  // ── PORTUGAL ──
  portugal: "pt",
  "liga portugal": "pt",
  "primeira liga": "pt",
  // ── BELGIUM ──
  belgium: "be",
  belgique: "be",
  "pro league": "be",
  "challenger pro league": "be",
  // ── TURKEY ──
  turkey: "tr",
  turquie: "tr",
  "super lig": "tr",
  // ── BRAZIL / ARGENTINA / USA ──
  brazil: "br",
  "brésil": "br",
  bresil: "br",
  argentina: "ar",
  argentine: "ar",
  usa: "us",
  "united states": "us",
  // ── CROATIA ──
  croatia: "hr",
  croatie: "hr",
  hnl: "hr",
  // ── SWITZERLAND ──
  switzerland: "ch",
  suisse: "ch",
  // Note : "super league" est ambigu (Suisse / Grèce) ; on s'appuie sur le champ
  // country quand il est disponible, ce qui est le cas côté backend.
  // ── GREECE ──
  greece: "gr",
  grece: "gr",
  // ── JAPAN ──
  japan: "jp",
  japon: "jp",
  "j1 league": "jp",
  "j2 league": "jp",
  // ── MEXICO ──
  mexico: "mx",
  mexique: "mx",
  "liga mx": "mx",
  // ── AUSTRALIA ──
  australia: "au",
  australie: "au",
  "a-league": "au",
  "a league": "au",
  // ── SLOVENIA ──
  slovenia: "si",
  slovenie: "si",
  "prva liga": "si",
  // ── SLOVAKIA ──
  slovakia: "sk",
  slovaquie: "sk",
  "super liga": "sk",
  // ── EUROPE (coupes UEFA) ──
  europe: "eu",
  "champions league": "eu",
  "europa league": "eu",
  "europa conference league": "eu",
  "conference league": "eu",
};

// Codes ISO directs (cas où country = "CH", "SW", "FR"…) — gère aussi l'alias
// historique "SW" qui pointait sur la Suisse.
const CODE_TO_CODE: Record<string, string> = {
  ch: "ch", sw: "ch",
  fr: "fr",
  de: "de",
  es: "es",
  gb: "gb-eng", en: "gb-eng", eng: "gb-eng",
  it: "it",
  nl: "nl",
  pt: "pt",
  be: "be",
  tr: "tr",
  br: "br",
  ar: "ar",
  us: "us",
  hr: "hr",
  gr: "gr",
  jp: "jp",
  mx: "mx",
  au: "au",
  si: "si",
  sk: "sk",
  eu: "eu",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function getCode({ country, league, flag }: CountryFlagProps): string {
  if (flag && /^https?:\/\//.test(flag)) return "";
  if (flag && EMOJI_TO_CODE[flag]) return EMOJI_TO_CODE[flag];

  const countryKey = country ? normalize(country) : "";

  // 1) Code ISO direct (CH, FR, SW…)
  if (countryKey && CODE_TO_CODE[countryKey]) return CODE_TO_CODE[countryKey];

  // 2) Nom de pays complet (Switzerland, Suisse…)
  if (countryKey && TEXT_TO_CODE[countryKey]) return TEXT_TO_CODE[countryKey];

  // 3) Fallback via le nom de ligue (Super League, Premier League…)
  const leagueKey = league ? normalize(league) : "";
  if (leagueKey && TEXT_TO_CODE[leagueKey]) return TEXT_TO_CODE[leagueKey];

  return "";
}

function fallbackText(country?: string | null, league?: string | null): string {
  const source = country || league || "";
  const compact = source.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  return compact || "•";
}

export function CountryFlag({ country, league, flag, className }: CountryFlagProps) {
  const base =
    className ||
    "h-[15px] w-[22px] shrink-0 overflow-hidden rounded-[3px] border border-white/10 object-cover";

  if (flag && /^https?:\/\//.test(flag)) {
    return <img src={flag} alt={country || league || "Pays"} className={base} />;
  }

  const code = getCode({ country, league, flag });
  if (code) {
    // Coupes UEFA (Champions/Europa/Conference) — flagcdn n'a pas "eu", on utilise
    // une URL stable d'icône EU pour le marquage Europe.
    if (code === "eu") {
      return (
        <img
          src="https://flagcdn.com/w40/eu.png"
          alt={country || league || "Europe"}
          className={base}
          onError={(e) => {
            // si flagcdn ne sert pas "eu", on retombe sur un placeholder neutre
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
    return (
      <img
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        alt={country || league || code.toUpperCase()}
        className={base}
      />
    );
  }

  return (
    <span
      className={`${base} flex items-center justify-center bg-white/[0.045] text-[8px] font-black tracking-[0.04em] text-[rgba(243,246,247,0.58)]`}
    >
      {fallbackText(country, league)}
    </span>
  );
}
