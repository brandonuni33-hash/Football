// domain/gameplay/matchInteractionPolicy.js
// Détermine quels matchs méritent une intervention du joueur.
// Objectif : préserver le rythme d'un bloc. Les matchs ordinaires restent simulés.

const text = value => String(value ?? '').toLowerCase();

export function getMatchImportance(match) {
    const phase = text(match?.phase);
    const round = text(match?.round || match?.europeanRound);
    const type = text(match?.type);
    const importance = text(match?.importance);

    if (phase.includes('final') || round.includes('final') || importance === 'final') return 'exceptional';
    if (match?.isDerby || match?.rival || type.includes('rival') || ['high', 'important'].includes(importance)) return 'important';
    return 'normal';
}

export function shouldInteractWithMatch(match, { blockMatches = [], previousInteractive = false } = {}) {
    if (!match || previousInteractive) return false;

    const importance = getMatchImportance(match);
    if (importance === 'exceptional' || importance === 'important') return true;

    // Un match ordinaire ne devient interactif que rarement.
    // Cela évite que le joueur doive prendre une décision à chaque rencontre.
    const classicMatches = blockMatches.filter(item => getMatchImportance(item) === 'normal');
    if (classicMatches.length === 0) return false;

    // Un seul match ordinaire maximum peut être mis en avant dans un bloc.
    // La probabilité reste volontairement faible.
    return Math.random() < 0.12 && match === classicMatches[0];
}

export function selectInteractiveMatch(matches = []) {
    if (!Array.isArray(matches) || !matches.length) return null;

    // Priorité absolue aux matchs exceptionnels, puis importants.
    const exceptional = matches.find(match => getMatchImportance(match) === 'exceptional');
    if (exceptional) return exceptional;

    const important = matches.find(match => getMatchImportance(match) === 'important');
    if (important) return important;

    // Pour les matchs classiques : un seul peut émerger, rarement.
    return shouldInteractWithMatch(matches[0], { blockMatches: matches }) ? matches[0] : null;
}

export default { getMatchImportance, shouldInteractWithMatch, selectInteractiveMatch };
