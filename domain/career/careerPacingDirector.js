// domain/career/careerPacingDirector.js
// Décide du niveau d'attention d'un fait déjà résolu. Il ne simule rien et ne compose aucun texte.

export const CAREER_PACE = Object.freeze({
    SKIP: 'SKIP',
    GLIMPSE: 'GLIMPSE',
    SCENE: 'SCENE',
    MOMENT: 'MOMENT',
    LANDMARK: 'LANDMARK'
});

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const TYPE_BASE = Object.freeze({
    training: 4,
    ordinary_match: 10,
    performance: 12,
    role_change: 34,
    coach: 30,
    family: 20,
    injury: 38,
    recovery: 28,
    promotion: 45,
    selection: 48,
    transfer_interest: 22,
    transfer_offer: 42,
    pro_contract: 82,
    senior_debut: 84,
    first_pro_start: 78,
    title_decider: 72,
    final: 66,
    major_final: 84,
    retirement: 90,
    last_match: 96,
    career_end: 100
});

export function scoreCareerMoment(fact = {}, context = {}) {
    const type = String(fact.type || 'ordinary_match');
    let score = number(TYPE_BASE[type], 12);

    if (fact.firstTime) score += 20;
    if (fact.personalRecord) score += 12;
    if (fact.careerRecord) score += 18;
    if (fact.decisive) score += 15;
    if (fact.knockout) score += 8;
    if (fact.rivalry) score += 8;
    if (fact.returnFromMajorInjury) score += 18;
    if (fact.statusChanged) score += 16;
    if (fact.chapterAnswering) score += 20;
    if (fact.choiceRequired) score += 12;

    // La surprise doit être relative à ce joueur, jamais un bonus de potentiel.
    score += clamp(number(fact.expectationGap), -20, 25);

    // Répéter un événement déjà vu doit accélérer l'expérience.
    score -= clamp(number(context.similarRecentCount) * 8, 0, 32);
    score -= clamp(number(context.sameTypeThisSeason) * 3, 0, 18);

    // Après une longue période sans scène, une évolution modérée peut redevenir visible.
    score += clamp(Math.floor(number(context.daysSinceMeaningfulScene) / 45) * 4, 0, 12);

    return clamp(Math.round(score), 0, 100);
}

export function classifyCareerPace(score) {
    const value = clamp(number(score), 0, 100);
    if (value >= 82) return CAREER_PACE.LANDMARK;
    if (value >= 60) return CAREER_PACE.MOMENT;
    if (value >= 34) return CAREER_PACE.SCENE;
    if (value >= 16) return CAREER_PACE.GLIMPSE;
    return CAREER_PACE.SKIP;
}

export function evaluateCareerPace(fact = {}, context = {}) {
    const score = scoreCareerMoment(fact, context);
    return {
        score,
        pace: classifyCareerPace(score),
        shouldInterrupt: score >= 34,
        shouldNarrate: score >= 16
    };
}

export const CareerPacingDirector = Object.freeze({
    PACE: CAREER_PACE,
    score: scoreCareerMoment,
    classify: classifyCareerPace,
    evaluate: evaluateCareerPace
});

export default CareerPacingDirector;
