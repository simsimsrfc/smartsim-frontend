import { Activity, CircleDot, Goal, ShieldCheck, Sparkles, Swords, TrendingUp } from "lucide-react";
import type { MatchDetail } from "@/lib/types";
import { over25DisplayProbability } from "@/lib/probabilities";
import type { AnalysisSignal, AnalysisViewConfig, MatchAnalysisSource, MatchAnalysisTab, MatchAnalysisView, ProbabilityItem, ResultPick } from "./types";

const MATCHES_TABS: MatchAnalysisTab[] = [
  { key: "over25", label: "+2,5" },
  { key: "result", label: "Résultat" },
  { key: "over15", label: "+1,5" },
  { key: "btts", label: "L2M" },
];

const SMART_OVER25_TABS: MatchAnalysisTab[] = [
  { key: "recommendation-over25", label: "Recommandations", hrefTab: "recommendations" },
  ...MATCHES_TABS,
];

const SMART_RESULT_TABS: MatchAnalysisTab[] = [
  { key: "recommendation-result", label: "Recommandations", hrefTab: "recommendations" },
  ...MATCHES_TABS,
];

export function getMatchAnalysisTabs(source: MatchAnalysisSource): MatchAnalysisTab[] {
  if (source === "smart-over25") return SMART_OVER25_TABS;
  if (source === "smart-result") return SMART_RESULT_TABS;
  return MATCHES_TABS;
}

export function parseAnalysisView(source: MatchAnalysisSource, tab?: string): MatchAnalysisView {
  if (tab === "over25" || tab === "result" || tab === "over15" || tab === "btts") return tab;
  if (source === "smart-over25") return "recommendation-over25";
  if (source === "smart-result") return "recommendation-result";
  return "over25";
}

export function getAnalysisViewConfig(view: MatchAnalysisView, match: MatchDetail): AnalysisViewConfig {
  const result = getResultPick(match);
  const p = match.probabilities;
  const home = match.home_team.name;
  const away = match.away_team.name;

  if (view === "recommendation-over25") {
    const base = getAnalysisViewConfig("over25", match);
    return {
      ...base,
      title: "Recommandation",
      badge: "Smart Sim +2,5",
      shortText: base.available
        ? "Smart Sim recommande +2,5 buts sur cette rencontre."
        : base.shortText,
      whyTitle: "Pourquoi cette recommandation ?",
      summaryTitle: "Résumé de cette recommandation",
      summary: base.available
        ? `Smart Sim recommande +2,5 buts car ${home} et ${away} présentent des signaux offensifs solides, peuvent créer des situations dangereuses et laisser des espaces dans certaines phases. Le profil du match indique une rencontre ouverte, avec une probabilité intéressante d’atteindre au moins trois buts.`
        : base.summary,
    };
  }

  if (view === "recommendation-result") {
    const selection = getResultSelectionPick(match);
    if (!selection) {
      return {
        title: "Recommandation",
        badge: "Avis résultat",
        primary: "—",
        subPrimary: "",
        probability: null,
        available: false,
        shortText: "Aucune recommandation résultat forte disponible pour ce match.",
        whyTitle: "Pourquoi cette recommandation ?",
        summaryTitle: "Résumé de cette recommandation",
        signals: resultSignals(home, away, "cette lecture"),
        summary:
          "Aucune recommandation résultat forte n'est disponible pour ce match avec les données actuelles. Vous pouvez consulter l'onglet Résultat pour voir la lecture générale issue des probabilités disponibles.",
      };
    }

    return {
      title: "Notre recommandation Smart Sim",
      badge: "Avis résultat Smart Sim",
      primary: selection.code,
      subPrimary: selection.label,
      probability: selection.value,
      available: true,
      shortText: `Smart Sim retient ${selection.label.toLowerCase()} sur cette rencontre.`,
      whyTitle: "Pourquoi cette recommandation ?",
      summaryTitle: "Résumé de cette recommandation",
      signals: resultSignals(home, away, selection.label),
      summary: `Smart Sim retient ${selection.label.toLowerCase()} car les signaux disponibles convergent vers cette lecture du match. La recommandation reste mesurée, mais la dynamique, le contexte et l'équilibre des forces donnent davantage de poids à ce scénario que les autres issues possibles.`,
    };
  }

  if (view === "result") {
    const available = Boolean(result && isRealProbability(result.value));
    const label = result?.label || "Indisponible";
    const pct = result?.value ? Math.round(result.value * 100) : 0;
    const confLevel = pct >= 70 ? "très nette" : pct >= 55 ? "solide" : pct >= 45 ? "légère" : "faible";
    const home_prob = Math.round((p?.home_win || 0) * 100);
    const draw_prob = Math.round((p?.draw || 0) * 100);
    const away_prob = Math.round((p?.away_win || 0) * 100);
    return {
      title: "Analyse résultat du match",
      primary: result?.code || "—",
      subPrimary: available ? label : "",
      probability: result?.value ?? null,
      available,
      shortText: available ? `Le modèle donne ${pct}% à ${label.toLowerCase()}, une préférence ${confLevel}.` : "",
      whyTitle: "Pourquoi ce résultat ?",
      summaryTitle: "Résumé de pourquoi ce résultat",
      signals: resultSignals(home, away, label),
      summary: available
        ? `Le calcul répartit les probabilités ainsi : ${home} ${home_prob}% · nul ${draw_prob}% · ${away} ${away_prob}%. ${label} ressort avec ${pct}% (préférence ${confLevel}). Cette lecture s'appuie sur la forme récente pondérée des deux équipes, l'avantage du terrain et le contexte de rencontre. Les autres issues restent possibles mais moins probables selon les signaux actuels.`
        : `Les données disponibles ne permettent pas d'afficher une lecture fiable sur l'issue du match entre ${home} et ${away}.`,
    };
  }

  if (view === "over15") {
    const value = safeProbability(p.over_15);
    const pct = value ? Math.round(value * 100) : 0;
    const strength = pct >= 85 ? "très forte" : pct >= 70 ? "solide" : pct >= 55 ? "correcte" : "modérée";
    return {
      title: "Analyse +1,5 buts",
      primary: "+1,5 buts",
      subPrimary: "",
      probability: value,
      available: value !== null,
      shortText: value !== null ? `Probabilité ${strength} à ${pct}% de dépasser 2 buts.` : "",
      whyTitle: "Pourquoi +1,5 ?",
      summaryTitle: "Résumé de pourquoi +1,5",
      signals: over15Signals(home, away),
      summary:
        value !== null
          ? `Le modèle estime à ${pct}% la probabilité d'atteindre au moins 2 buts (confiance ${strength}). Ce seuil reste le plus accessible parmi les marchés buts : il suffit qu'une des deux équipes marque un doublé ou que le match soit ouvert des deux côtés. Le profil offensif de ${home} et ${away} rend ce scénario probable, même si un match verrouillé reste possible.`
          : `Les données disponibles ne permettent pas d'afficher une lecture fiable sur le seuil +1,5 buts pour ce match.`,
    };
  }

  if (view === "btts") {
    const value = safeProbability(p.btts);
    const pct = value ? Math.round(value * 100) : 0;
    const isSelection = Boolean(match.l2m_selection?.is_selection);
    const strength = pct >= 65 ? "solide" : pct >= 50 ? "équilibrée" : "faible";
    return {
      title: "Analyse L2M",
      primary: "L2M",
      subPrimary: "Les deux marquent",
      probability: value,
      available: value !== null,
      shortText: value !== null ? `${pct}% que les deux équipes marquent (lecture ${strength}).` : "",
      whyTitle: "Pourquoi L2M ?",
      summaryTitle: "Résumé de pourquoi L2M",
      signals: bttsSignals(home, away),
      summary:
        value !== null
          ? `Probabilité estimée à ${pct}% que les deux équipes marquent. ${isSelection ? "Cette valeur dépasse le seuil de sélection L2M, ce qui renforce la lecture. " : ""}${home} et ${away} possèdent chacun des arguments offensifs pour trouver le chemin des filets, tout en laissant des espaces défensifs dans certaines phases. Un scénario où l'une des deux équipes garde sa cage inviolée reste néanmoins envisageable.`
          : `Les données disponibles ne permettent pas d'afficher une lecture fiable sur L2M pour ce match.`,
    };
  }

  const value = safeProbability(over25DisplayProbability(match));
  const pct = value ? Math.round(value * 100) : 0;
  const strength = pct >= 70 ? "très marquée" : pct >= 55 ? "solide" : pct >= 45 ? "équilibrée" : "modérée";
  const btts = Math.round((p?.btts || 0) * 100);
  return {
    title: "Analyse +2,5 buts",
    primary: "+2,5 buts",
    subPrimary: "",
    probability: value,
    available: value !== null,
    shortText: value !== null ? `${pct}% de chance que ce match dépasse 3 buts (tendance ${strength}).` : "",
    whyTitle: "Pourquoi +2,5 ?",
    summaryTitle: "Résumé de pourquoi +2,5",
    signals: over25Signals(home, away),
    summary:
      value !== null
        ? `Le modèle Poisson estime à ${pct}% la probabilité qu'au moins 3 buts soient inscrits (tendance ${strength})${btts > 0 ? `, avec ${btts}% de chance que les deux équipes marquent` : ""}. Cette lecture s'appuie sur la moyenne pondérée des buts marqués et encaissés par ${home} et ${away} sur leurs 10 dernières rencontres. Un match plus fermé reste possible si l'un des deux entraîneurs opte pour un plan prudent.`
        : `Les données disponibles ne permettent pas d'afficher une lecture fiable sur le seuil +2,5 buts pour ce match.`,
  };
}

export function getProbabilityItems(match: MatchDetail): ProbabilityItem[] {
  const result = getResultPick(match);
  return [
    { key: "result", label: "Résultat probable", value: result?.value ?? null, helper: result?.code || "—" },
    { key: "over25", label: "+2,5 buts", value: safeProbability(over25DisplayProbability(match)), helper: "" },
    { key: "over15", label: "+1,5 buts", value: safeProbability(match?.probabilities?.over_15), helper: "" },
    { key: "btts", label: "L2M", value: safeProbability(match?.probabilities?.btts), helper: "" },
  ];
}

export function getResultPick(match: MatchDetail): ResultPick | null {
  const selection = getResultSelectionPick(match);
  if (selection) return selection;

  const p = match?.probabilities;
  const entries: ResultPick[] = [
    { code: "1", label: "Victoire domicile", value: p?.home_win as number },
    { code: "N", label: "Match nul", value: p?.draw as number },
    { code: "2", label: "Victoire extérieur", value: p?.away_win as number },
  ].filter((item): item is ResultPick => isRealProbability(item.value));

  if (match.predicted_winner && isRealProbability(match.winner_proba)) {
    const normalized = String(match.predicted_winner || "").toLowerCase();
    const homeName = String(match?.home_team?.name || "").toLowerCase();
    const awayName = String(match?.away_team?.name || "").toLowerCase();
    if (normalized.includes("draw") || normalized.includes("nul")) {
      return { code: "N", label: "Match nul", value: match.winner_proba };
    }
    if (normalized.includes("away") || normalized.includes("exter") || (awayName && normalized === awayName)) {
      return { code: "2", label: "Victoire extérieur", value: match.winner_proba };
    }
    if (normalized.includes("home") || normalized.includes("domi") || (homeName && normalized === homeName)) {
      return { code: "1", label: "Victoire domicile", value: match.winner_proba };
    }
  }

  return entries.sort((a, b) => b.value - a.value)[0] || null;
}

function getResultSelectionPick(match: MatchDetail): ResultPick | null {
  const selection = match.result_selection;
  if (!selection?.is_result_selection || !selection.pick || !isRealProbability(selection.probability)) {
    return null;
  }

  return {
    code: selection.pick,
    label: selection.label || resultPickLabel(selection.pick),
    value: selection.probability,
  };
}

function resultPickLabel(pick: ResultPick["code"]): string {
  return {
    "1": "Victoire domicile",
    N: "Match nul",
    "2": "Victoire extérieur",
    "1N": "Victoire ou nul",
    N2: "Nul ou victoire extérieur",
    "12": "Domicile ou extérieur",
  }[pick];
}

export function safeProbability(value: number | null | undefined): number | null {
  return isRealProbability(value) ? value : null;
}

export function isRealProbability(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function over25Signals(home: string, away: string): AnalysisSignal[] {
  return [
    { title: "Profil offensif", text: `${home} et ${away} peuvent créer des occasions dans des zones dangereuses.`, icon: <Goal size={20} /> },
    { title: "Espaces possibles", text: "Le contexte peut favoriser des phases ouvertes et des transitions rapides.", icon: <ShieldCheck size={20} /> },
    { title: "Rythme de match", text: "La rencontre peut gagner en intensité si une équipe marque tôt.", icon: <TrendingUp size={20} /> },
    { title: "Enjeux du match", text: "La motivation des deux équipes peut pousser le match vers l’avant.", icon: <Sparkles size={20} /> },
  ];
}

function over15Signals(home: string, away: string): AnalysisSignal[] {
  return [
    { title: "Deux attaques présentes", text: `${home} et ${away} ont des profils capables de produire au moins quelques occasions franches.`, icon: <Goal size={20} /> },
    { title: "Seuil accessible", text: "Le seuil de deux buts reste compatible avec plusieurs scénarios de match.", icon: <CircleDot size={20} /> },
    { title: "Rythme potentiel", text: "Le match peut s’ouvrir si le premier but arrive assez tôt.", icon: <TrendingUp size={20} /> },
    { title: "Tendance de jeu", text: "Les deux équipes peuvent chercher à avancer plutôt qu’à subir longtemps.", icon: <Activity size={20} /> },
  ];
}

function bttsSignals(home: string, away: string): AnalysisSignal[] {
  return [
    { title: "Menace des deux côtés", text: `${home} et ${away} ont chacun des arguments pour marquer.`, icon: <Goal size={20} /> },
    { title: "Réponse possible", text: "Une ouverture du score peut forcer l’autre équipe à réagir.", icon: <TrendingUp size={20} /> },
    { title: "Occasions partagées", text: "La rencontre peut produire des situations dans les deux surfaces.", icon: <Swords size={20} /> },
    { title: "Équilibre du match", text: "Le rapport de forces ne ferme pas la porte à un but de chaque équipe.", icon: <ShieldCheck size={20} /> },
  ];
}

function resultSignals(home: string, away: string, label: string): AnalysisSignal[] {
  return [
    { title: "Dynamique générale", text: `Les signaux disponibles orientent la lecture vers ${label.toLowerCase()}.`, icon: <TrendingUp size={20} /> },
    { title: "Gestion du match", text: `${home} et ${away} peuvent influencer le rythme selon le premier temps fort.`, icon: <Activity size={20} /> },
    { title: "Équilibre des forces", text: "L’écart de confiance reste interprété avec prudence dans ce type de rencontre.", icon: <ShieldCheck size={20} /> },
    { title: "Contexte de rencontre", text: "Le lieu, l’heure et la dynamique récente cadrent la lecture du résultat.", icon: <CircleDot size={20} /> },
  ];
}
