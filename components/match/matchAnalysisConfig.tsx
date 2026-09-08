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
    return {
      title: "Analyse résultat du match",
      primary: result?.code || "—",
      subPrimary: available ? label : "",
      probability: result?.value ?? null,
      available,
      shortText: available ? `Notre lecture penche vers ${label.toLowerCase()} sur cette rencontre.` : "",
      whyTitle: "Pourquoi ce résultat ?",
      summaryTitle: "Résumé de pourquoi ce résultat",
      signals: resultSignals(home, away, label),
      summary: available
        ? `La lecture du match donne un léger avantage au scénario ${label.toLowerCase()}, en s’appuyant sur l’équilibre global entre dynamique, efficacité récente et contexte de rencontre. ${home} et ${away} présentent des profils capables de peser sur le déroulement du match, mais les signaux disponibles orientent la confiance vers cette issue sans exclure un scénario plus fermé ou plus disputé.`
        : `Les données disponibles ne permettent pas d’afficher une lecture fiable sur l’issue du match entre ${home} et ${away}.`,
    };
  }

  if (view === "over15") {
    const value = safeProbability(p.over_15);
    return {
      title: "Analyse +1,5 buts",
      primary: "+1,5 buts",
      subPrimary: "",
      probability: value,
      available: value !== null,
      shortText: "Le match présente un profil compatible avec au moins deux buts.",
      whyTitle: "Pourquoi +1,5 ?",
      summaryTitle: "Résumé de pourquoi +1,5",
      signals: over15Signals(home, away),
      summary:
        value !== null
          ? `Cette rencontre présente plusieurs signaux favorables à un total d’au moins deux buts. Les deux équipes disposent de ressources offensives, le rythme attendu peut ouvrir des espaces et le contexte du match laisse envisager des occasions des deux côtés. La lecture reste donc cohérente avec un scénario où le score évolue suffisamment pour dépasser le seuil de +1,5 buts.`
          : `Les données disponibles ne permettent pas d’afficher une lecture fiable sur le seuil +1,5 buts pour ce match.`,
    };
  }

  if (view === "btts") {
    const value = safeProbability(p.btts);
    const isSelection = Boolean(match.l2m_selection?.is_selection);
    return {
      title: "Analyse L2M",
      primary: "L2M",
      subPrimary: "Les deux marquent",
      probability: value,
      available: value !== null,
      shortText: isSelection
        ? "Lecture L2M renforcée par une probabilité supérieure au seuil de sélection."
        : "Les deux équipes peuvent trouver le chemin des filets.",
      whyTitle: "Pourquoi L2M ?",
      summaryTitle: "Résumé de pourquoi L2M",
      signals: bttsSignals(home, away),
      summary:
        value !== null
          ? `${home} et ${away} possèdent tous les deux des arguments pour marquer dans cette rencontre. La lecture met en avant des profils offensifs capables de créer des situations dangereuses, tout en laissant la possibilité d’espaces défensifs dans certaines phases du match. Le scénario où les deux équipes trouvent le chemin des filets reste donc cohérent avec les données disponibles.`
          : `Les données disponibles ne permettent pas d’afficher une lecture fiable sur L2M pour ce match.`,
    };
  }

  const value = safeProbability(over25DisplayProbability(match));
  return {
    title: "Analyse +2,5 buts",
    primary: "+2,5 buts",
    subPrimary: "",
    probability: value,
    available: value !== null,
    shortText: "Le profil du match suggère plus de 2,5 buts dans cette rencontre.",
    whyTitle: "Pourquoi +2,5 ?",
    summaryTitle: "Résumé de pourquoi +2,5",
    signals: over25Signals(home, away),
    summary:
      value !== null
        ? `Notre lecture met en avant un profil de match ouvert. Les deux équipes présentent des signaux offensifs intéressants, avec une capacité à créer des occasions et des défenses qui peuvent laisser des espaces. Le scénario d’un match animé reste donc cohérent avec les données disponibles.`
        : `Les données disponibles ne permettent pas d’afficher une lecture fiable sur le seuil +2,5 buts pour ce match.`,
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
    const normalized = match.predicted_winner.toLowerCase();
    if (normalized.includes("draw") || normalized.includes("nul")) {
      return { code: "N", label: "Match nul", value: match.winner_proba };
    }
    if (normalized.includes("away") || normalized === match.away_team.name.toLowerCase()) {
      return { code: "2", label: "Victoire extérieur", value: match.winner_proba };
    }
    if (normalized.includes("home") || normalized === match.home_team.name.toLowerCase()) {
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
