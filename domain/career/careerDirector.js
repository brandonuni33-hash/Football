// domain/career/careerDirector.js
// Interprète l'état de carrière sans produire de texte ni modifier la simulation.

import {
    CAREER_QUESTION_IDS,
    getCareerQuestion,
    getNextCareerQuestion
} from './careerQuestionCatalog.js';

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const bool = value => value === true;

export function createCareerDirectorState(existing = null) {
    return {
        questionId: existing?.questionId || CAREER_QUESTION_IDS.UNKNOWN_SELF,
        enteredAtAge: number(existing?.enteredAtAge, 14),
        answeredQuestionIds: Array.isArray(existing?.answeredQuestionIds) ? [...existing.answeredQuestionIds] : [],
        version: 1
    };
}

function seniorEvidence(state) {
    const player = state?.player || {};
    const seniorApps = number(player.seniorAppearances ?? player.proAppearances ?? player.professionalAppearances);
    const pro = bool(player.isProfessional) || bool(player.hasProContract) || bool(player.professional);
    return { seniorApps, pro };
}

function stableProEvidence(state) {
    const player = state?.player || {};
    const { seniorApps, pro } = seniorEvidence(state);
    const starts = number(player.seniorStarts ?? player.proStarts ?? player.careerStats?.starts);
    const minutes = number(player.seniorMinutes ?? player.proMinutes ?? player.careerStats?.minutes);
    return pro && (seniorApps >= 12 || starts >= 8 || minutes >= 720);
}

function establishedEvidence(state) {
    const player = state?.player || {};
    const { seniorApps, pro } = seniorEvidence(state);
    const seasons = number(player.proSeasons ?? player.professionalSeasons ?? player.careerStats?.proSeasons);
    return pro && (seniorApps >= 45 || seasons >= 2);
}

export function inferCareerQuestion(state, directorState = null) {
    const player = state?.player || {};
    const age = number(player.age, 14);
    const current = createCareerDirectorState(directorState ?? state?.careerDirector);
    const { seniorApps, pro } = seniorEvidence(state);

    // L'âge est une garde de plausibilité, jamais la condition suffisante.
    if (bool(player.retired) || bool(player.careerEnded)) return getCareerQuestion(CAREER_QUESTION_IDS.LEGACY);

    if (age >= 30 && establishedEvidence(state)) {
        if (age >= 34 || bool(player.retirementConsidering)) return getCareerQuestion(CAREER_QUESTION_IDS.LAST_AMBITIONS);
        return getCareerQuestion(CAREER_QUESTION_IDS.BODY_CHANGES);
    }

    if (establishedEvidence(state)) {
        if (age >= 24) return getCareerQuestion(CAREER_QUESTION_IDS.LIVE_WITH_STATUS);
        return getCareerQuestion(CAREER_QUESTION_IDS.CAREER_CEILING);
    }

    if (stableProEvidence(state)) return getCareerQuestion(CAREER_QUESTION_IDS.BECOME_PLAYER);
    if (pro || seniorApps > 0) return getCareerQuestion(CAREER_QUESTION_IDS.EXIST_AS_PRO);

    const stage = String(player.careerStage || player.stage || '').toLowerCase();
    const adultFootball = /senior|reserve|réserve|adult|u20|u19/.test(stage) || bool(player.trainingWithSeniors);
    if (adultFootball || age >= 18) return getCareerQuestion(CAREER_QUESTION_IDS.REACH_ADULT_FOOTBALL);

    const promoted = bool(player.promotedCategory) || bool(player.playingUp) || number(player.categoryPromotions) > 0;
    if (promoted || age >= 16) return getCareerQuestion(CAREER_QUESTION_IDS.OUTGROW_ENVIRONMENT);

    const starts = number(player.seasonStats?.starts ?? player.starts);
    const appearances = number(player.seasonStats?.matches ?? player.appearances);
    if (starts >= 4 || appearances >= 8 || age >= 15) return getCareerQuestion(CAREER_QUESTION_IDS.EARN_PLACE);

    return getCareerQuestion(current.questionId);
}

export function evaluateCareerDirector(state) {
    const previous = createCareerDirectorState(state?.careerDirector);
    const inferred = inferCareerQuestion(state, previous);
    const previousQuestion = getCareerQuestion(previous.questionId);
    const advanced = inferred.order > previousQuestion.order;

    return {
        previousQuestion,
        question: inferred,
        advanced,
        skippedQuestions: advanced
            ? Math.max(0, inferred.order - previousQuestion.order - 1)
            : 0,
        nextQuestion: getNextCareerQuestion(inferred.id),
        state: advanced
            ? {
                ...previous,
                questionId: inferred.id,
                enteredAtAge: number(state?.player?.age, previous.enteredAtAge),
                answeredQuestionIds: [...new Set([...previous.answeredQuestionIds, previousQuestion.id])]
            }
            : previous
    };
}

export const CareerDirector = Object.freeze({
    createState: createCareerDirectorState,
    inferQuestion: inferCareerQuestion,
    evaluate: evaluateCareerDirector
});

export default CareerDirector;
