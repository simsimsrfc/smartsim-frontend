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

function _streakStats(form: string[]): { maxW: number; maxL: number; maxN: number; avgWStreak: number } {
  // Longest run for each outcome + moyenne des séries de V dans les 10 derniers
  let maxW = 0, maxL = 0, maxN = 0;
  let curW = 0, curL = 0, curN = 0;
  const wStreaks: number[] = [];
  let running = 0;
  for (const r of form) {
    if (r === "W") { curW++; running++; maxW = Math.max(maxW, curW); curL = 0; curN = 0; }
    else {
      if (running > 0) wStreaks.push(running);
      running = 0;
      if (r === "L") { curL++; maxL = Math.max(maxL, curL); curW = 0; curN = 0; }
      else if (r === "D") { curN++; maxN = Math.max(maxN, curN); curW = 0; curL = 0; }
    }
  }
  if (running > 0) wStreaks.push(running);
  const avgWStreak = wStreaks.length > 0 ? wStreaks.reduce((a, b) => a + b, 0) / wStreaks.length : 0;
  return { maxW, maxL, maxN, avgWStreak };
}

function _formNote(form: string[] | undefined, teamName: string): string | null {
  if (!form || form.length === 0) return null;
  const w = form.filter((r) => r === "W").length;
  const d = form.filter((r) => r === "D").length;
  const l = form.filter((r) => r === "L").length;
  const streak = form[0]; // most recent
  const consecutive = form.findIndex((r) => r !== streak);
  const streakLen = consecutive === -1 ? form.length : consecutive;
  const s = _streakStats(form);

  // Cas 1 : série en cours exceptionnelle vs habitude de l'équipe
  if (streakLen >= 3 && streak === "W") {
    const isExceptional = streakLen > s.avgWStreak * 1.6 && s.avgWStreak > 0 && streakLen > s.maxW - 1;
    if (isExceptional && streakLen >= s.maxW) {
      return `${teamName} sur ${streakLen} victoires (série max récente atteinte — attention régression possible)`;
    }
    return `${teamName} sur ${streakLen} victoires consécutives (moyenne récente ${s.avgWStreak.toFixed(1)})`;
  }
  if (streakLen >= 3 && streak === "L") {
    return `${teamName} sur ${streakLen} défaites consécutives — dynamique fragile`;
  }
  // Cas 2 : équipe qui n'arrive pas à enchaîner
  if (w >= 3 && s.maxW <= 1) {
    return `${teamName} : ${w}V mais aucune série (max 1V consécutive sur les ${form.length} derniers — irrégulier)`;
  }
  if (w >= 4) {
    const streakInfo = s.maxW >= 3 ? `série max ${s.maxW}V` : `sans série (max ${s.maxW}V)`;
    return `${teamName} en pleine confiance (${w}V sur les ${form.length} derniers, ${streakInfo})`;
  }
  if (l >= 4) return `${teamName} en difficulté (${l}D sur les ${form.length} derniers)`;
  if (d >= 3) return `${teamName} enchaîne les nuls (${d}N sur les ${form.length} derniers)`;
  return `${teamName} : forme ${w}V-${d}N-${l}D sur les ${form.length} derniers`;
}

function _h2hNote(h2h: MatchDetail["h2h"] | undefined, homeId: number | null | undefined,
                    homeName: string, awayName: string): string | null {
  if (!h2h || h2h.length === 0) return null;
  const wins_home = h2h.filter((m) => m.winner_id === homeId).length;
  const wins_away = h2h.filter((m) => m.winner_id != null && m.winner_id !== homeId).length;
  const draws = h2h.filter((m) => m.winner_id == null).length;
  if (wins_home > wins_away + 1)
    return `Historique favorable à ${homeName} : ${wins_home}V-${draws}N-${wins_away}D sur les derniers face-à-face`;
  if (wins_away > wins_home + 1)
    return `${awayName} domine l'historique récent : ${wins_away}V-${draws}N-${wins_home}D`;
  return `Face-à-face équilibré : ${wins_home}V-${draws}N-${wins_away}D`;
}

function _humanContext(match: MatchDetail): string[] {
  const out: string[] = [];
  const homeNote = _formNote(match.form?.home, match.home_team.name);
  const awayNote = _formNote(match.form?.away, match.away_team.name);
  if (homeNote) out.push(homeNote);
  if (awayNote) out.push(awayNote);
  const h2h = _h2hNote(match.h2h, match.home_team.id, match.home_team.name, match.away_team.name);
  if (h2h) out.push(h2h);
  return out;
}

function _insightsFor(view: MatchAnalysisView, match: MatchDetail): { headline?: string; warning?: string } {
  const ins = match.insights || {};
  if (view === "over25" || view === "recommendation-over25") {
    const o = (ins as any).over25 || {};
    return { headline: o.headline, warning: o.warning };
  }
  if (view === "over15") {
    const o = (ins as any).over15 || {};
    return { headline: o.headline, warning: o.warning };
  }
  if (view === "btts") {
    const o = (ins as any).btts || {};
    return { headline: o.headline, warning: o.warning };
  }
  if (view === "result" || view === "recommendation-result") {
    const o = (ins as any).result || {};
    return { headline: o.headline, warning: o.warning };
  }
  return {};
}

export function getAnalysisViewConfig(view: MatchAnalysisView, match: MatchDetail): AnalysisViewConfig {
  const result = getResultPick(match);
  const p = match.probabilities;
  const home = match.home_team.name;
  const away = match.away_team.name;
  const humanNotes = _humanContext(match);
  const humanSuffix = humanNotes.length > 0 ? " " + humanNotes.join(" · ") + "." : "";
  const _insights = _insightsFor(view, match);

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
    const pick = result?.code || "";
    const pct = result?.value ? Math.round(result.value * 100) : 0;
    const home_prob = Math.round((p?.home_win || 0) * 100);
    const draw_prob = Math.round((p?.draw || 0) * 100);
    const away_prob = Math.round((p?.away_win || 0) * 100);
    const isDouble = pick.length === 2;

    let short = "";
    let summary = "";
    if (available) {
      if (isDouble) {
        short = `Match indécis — sécuriser avec ${label.toLowerCase()} (${pct}%).`;
        summary = `Le match s'annonce serré : aucune issue ne se détache clairement (${home} ${home_prob}%, nul ${draw_prob}%, ${away} ${away_prob}%). Dans ce contexte, la lecture double chance ${label.toLowerCase()} rassemble ${pct}% des scénarios possibles, ce qui offre une protection intéressante face à l'incertitude. Un simple pari sur une des deux issues aurait trop peu de marge selon les signaux disponibles.`;
      } else if (pct >= 75) {
        short = `${label} très probable (${pct}%) — le match est déséquilibré.`;
        summary = `Le déséquilibre est net : ${home_prob}% pour ${home}, ${draw_prob}% pour le nul, ${away_prob}% pour ${away}. Avec ${pct}% sur ${label.toLowerCase()}, la lecture est parmi les plus tranchées possibles. La forme récente, l'écart de niveau et le contexte convergent tous vers ce scénario. Un retournement reste imaginable mais peu probable.`;
      } else if (pct >= 55) {
        short = `Avantage clair à ${label.toLowerCase()} (${pct}%).`;
        summary = `Répartition : ${home} ${home_prob}% · nul ${draw_prob}% · ${away} ${away_prob}%. La lecture privilégie ${label.toLowerCase()} sans exclure les autres issues. Les signaux offensifs et la forme récente pointent vers cette direction, tout en laissant une marge d'incertitude classique dans le football.`;
      } else {
        short = `Léger avantage pour ${label.toLowerCase()} (${pct}%), sans certitude.`;
        summary = `Aucune issue ne domine largement : ${home} ${home_prob}%, nul ${draw_prob}%, ${away} ${away_prob}%. ${label} sort de justesse en tête. Sur ce type de match ouvert, une lecture double chance peut offrir davantage de sécurité qu'un pari simple.`;
      }
    } else {
      summary = `Les données disponibles ne permettent pas d'afficher une lecture fiable sur l'issue du match entre ${home} et ${away}.`;
    }
    return {
      title: "Analyse résultat du match",
      primary: pick || "—",
      subPrimary: available ? label : "",
      probability: result?.value ?? null,
      available,
      shortText: short,
      whyTitle: "Pourquoi ce résultat ?",
      summaryTitle: "Ce qu'il faut retenir",
      signals: resultSignals(home, away, label),
      summary: summary + humanSuffix,
      insightHeadline: _insights.headline,
      insightWarning: _insights.warning,
    };
  }

  if (view === "over15") {
    const value = safeProbability(p.over_15);
    const pct = value ? Math.round(value * 100) : 0;
    let short = "";
    let summary = "";
    if (value !== null) {
      if (pct >= 85) {
        short = `Seuil quasi-acquis (${pct}%).`;
        summary = `Sur ce type de profil, dépasser 2 buts est presque une formalité : ${pct}%. Il faudrait un scénario très fermé (0-0 ou 1-0) pour rater ce seuil. Rare mais pas impossible.`;
      } else if (pct >= 65) {
        short = `Seuil accessible (${pct}%).`;
        summary = `${pct}% de chances d'atteindre au moins 2 buts. L'un des deux camps qui marque un doublé, ou les deux qui trouvent le chemin des filets, suffit à valider ce marché. La lecture reste favorable sans être un lock.`;
      } else {
        short = `Seuil incertain (${pct}%).`;
        summary = `Le profil défensif se lit ici : ${pct}% seulement pour dépasser 2 buts. Un match à 1-0, 0-1 ou 0-0 est franchement envisageable selon les données récentes de ${home} et ${away}.`;
      }
    } else {
      summary = `Les données disponibles ne permettent pas d'afficher une lecture fiable sur le seuil +1,5 buts pour ce match.`;
    }
    return {
      title: "Analyse +1,5 buts",
      primary: "+1,5 buts",
      subPrimary: "",
      probability: value,
      available: value !== null,
      shortText: short,
      whyTitle: "Pourquoi +1,5 ?",
      summaryTitle: "Ce qu'il faut retenir",
      signals: over15Signals(home, away),
      summary: summary + humanSuffix,
      insightHeadline: _insights.headline,
      insightWarning: _insights.warning,
    };
  }

  if (view === "btts") {
    const value = safeProbability(p.btts);
    const pct = value ? Math.round(value * 100) : 0;
    const isSelection = Boolean(match.l2m_selection?.is_selection);
    let short = "";
    let summary = "";
    if (value !== null) {
      if (pct >= 65) {
        short = `Les deux devraient marquer (${pct}%).`;
        summary = `Fort potentiel offensif des deux côtés : ${pct}% que ${home} et ${away} trouvent tous les deux le chemin des filets. ${isSelection ? "Ce niveau dépasse le seuil de sélection L2M. " : ""}Ce type de scénario suppose des défenses perméables ou un match rythmé. Un clean sheet resterait une petite surprise.`;
      } else if (pct >= 50) {
        short = `Scénario BTTS plausible (${pct}%).`;
        summary = `Équilibre entre l'hypothèse "les deux marquent" et "l'une des deux blanchit" : ${pct}% pour BTTS. Un match à un seul buteur est aussi envisageable qu'un partage des buts.`;
      } else {
        short = `Une des deux devrait rester muette (${pct}%).`;
        summary = `Le profil défensif d'une des deux équipes se voit ici : seulement ${pct}% que les deux marquent. Un score à sens unique (2-0, 3-1, 0-1) est plus cohérent avec les signaux disponibles.`;
      }
    } else {
      summary = `Les données disponibles ne permettent pas d'afficher une lecture fiable sur L2M pour ce match.`;
    }
    return {
      title: "Analyse L2M",
      primary: "L2M",
      subPrimary: "Les deux marquent",
      probability: value,
      available: value !== null,
      shortText: short,
      whyTitle: "Pourquoi L2M ?",
      summaryTitle: "Ce qu'il faut retenir",
      signals: bttsSignals(home, away),
      summary: summary + humanSuffix,
      insightHeadline: _insights.headline,
      insightWarning: _insights.warning,
    };
  }

  const value = safeProbability(over25DisplayProbability(match));
  const pct = value ? Math.round(value * 100) : 0;
  const btts = Math.round((p?.btts || 0) * 100);

  let short = "";
  let summary = "";
  if (value !== null) {
    if (pct >= 75) {
      short = `Attente forte de buts (${pct}%) — profil ouvert.`;
      summary = `Les indicateurs offensifs des deux équipes sont élevés, ce qui rend le seuil de 3 buts atteignable (${pct}%). ${btts >= 55 ? `Les deux équipes ont aussi ${btts}% de chances de marquer, ce qui renforce le scénario d'un match animé.` : ""} Sur ce type de rencontre, un match verrouillé serait une vraie surprise selon la forme récente.`;
    } else if (pct >= 55) {
      short = `Tendance offensive nette (${pct}%).`;
      summary = `Le calcul des espérances de buts penche vers un match avec au moins 3 buts (${pct}%). ${btts >= 50 ? `La probabilité que les deux marquent est de ${btts}%, ce qui appuie cette lecture.` : ""} La forme récente montre des équipes capables de créer, sans blindage défensif marqué.`;
    } else if (pct >= 40) {
      short = `Scénario équilibré (${pct}%) — ni fermé ni fou.`;
      summary = `Le potentiel offensif existe mais reste mesuré : ${pct}% de chances de dépasser 3 buts. Un match à 2-1 ou 1-1 ferait autant de sens qu'un 3-2. La lecture ne penche pas franchement d'un côté.`;
    } else {
      short = `Profil défensif attendu (${pct}%).`;
      summary = `Les données indiquent plutôt un match fermé : seulement ${pct}% pour dépasser 3 buts. ${home} et ${away} produisent peu d'occasions dans leurs dernières sorties, ou évoluent avec des défenses solides. Un score bas (0-0, 1-0, 1-1) est le scénario le plus cohérent.`;
    }
  } else {
    summary = `Les données disponibles ne permettent pas d'afficher une lecture fiable sur le seuil +2,5 buts pour ce match.`;
  }

  return {
    title: "Analyse +2,5 buts",
    primary: "+2,5 buts",
    subPrimary: "",
    probability: value,
    available: value !== null,
    shortText: short,
    whyTitle: "Pourquoi +2,5 ?",
    summaryTitle: "Ce qu'il faut retenir",
    signals: over25Signals(home, away),
    summary: summary + humanSuffix,
    insightHeadline: _insights.headline,
    insightWarning: _insights.warning,
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
