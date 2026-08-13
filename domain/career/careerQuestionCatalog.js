// domain/career/careerQuestionCatalog.js
// Questions structurelles de la carrière. Ce catalogue ne contient aucune narration.

export const CAREER_QUESTION_IDS = Object.freeze({
    UNKNOWN_SELF: 'unknown_self',
    EARN_PLACE: 'earn_place',
    OUTGROW_ENVIRONMENT: 'outgrow_environment',
    REACH_ADULT_FOOTBALL: 'reach_adult_football',
    EXIST_AS_PRO: 'exist_as_pro',
    BECOME_PLAYER: 'become_player',
    CAREER_CEILING: 'career_ceiling',
    LIVE_WITH_STATUS: 'live_with_status',
    BODY_CHANGES: 'body_changes',
    LAST_AMBITIONS: 'last_ambitions',
    LEGACY: 'legacy'
});

export const CAREER_QUESTIONS = Object.freeze([
    {
        id: CAREER_QUESTION_IDS.UNKNOWN_SELF,
        order: 1,
        question: 'Qui es-tu quand personne ne te connaît encore ?',
        phase: 'formation',
        targetMinutes: 6,
        minimumAge: 14
    },
    {
        id: CAREER_QUESTION_IDS.EARN_PLACE,
        order: 2,
        question: 'Est-ce que tu vas réussir à te faire une place ?',
        phase: 'formation',
        targetMinutes: 7,
        minimumAge: 14
    },
    {
        id: CAREER_QUESTION_IDS.OUTGROW_ENVIRONMENT,
        order: 3,
        question: 'Est-ce que ton niveau commence à dépasser ton environnement ?',
        phase: 'formation',
        targetMinutes: 7,
        minimumAge: 15
    },
    {
        id: CAREER_QUESTION_IDS.REACH_ADULT_FOOTBALL,
        order: 4,
        question: 'Est-ce que tu peux franchir le mur qui mène au football adulte ?',
        phase: 'formation',
        targetMinutes: 10,
        minimumAge: 16
    },
    {
        id: CAREER_QUESTION_IDS.EXIST_AS_PRO,
        order: 5,
        question: 'Est-ce que tu peux réellement exister chez les pros ?',
        phase: 'pro',
        targetMinutes: 7,
        minimumAge: 17
    },
    {
        id: CAREER_QUESTION_IDS.BECOME_PLAYER,
        order: 6,
        question: 'Quel joueur es-tu en train de devenir ?',
        phase: 'pro',
        targetMinutes: 7,
        minimumAge: 18
    },
    {
        id: CAREER_QUESTION_IDS.CAREER_CEILING,
        order: 7,
        question: 'Jusqu’où cette carrière peut-elle aller ?',
        phase: 'pro',
        targetMinutes: 9,
        minimumAge: 19
    },
    {
        id: CAREER_QUESTION_IDS.LIVE_WITH_STATUS,
        order: 8,
        question: 'Que fais-tu une fois que le football t’a trouvé une place ?',
        phase: 'pro',
        targetMinutes: 7,
        minimumAge: 22
    },
    {
        id: CAREER_QUESTION_IDS.BODY_CHANGES,
        order: 9,
        question: 'Que se passe-t-il quand ton corps ne te laisse plus tout faire ?',
        phase: 'late',
        targetMinutes: 6,
        minimumAge: 29
    },
    {
        id: CAREER_QUESTION_IDS.LAST_AMBITIONS,
        order: 10,
        question: 'Qu’est-ce qu’il te reste encore à accomplir ?',
        phase: 'late',
        targetMinutes: 7,
        minimumAge: 31
    },
    {
        id: CAREER_QUESTION_IDS.LEGACY,
        order: 11,
        question: 'Qu’est-ce qu’il reste de toi quand tout s’arrête ?',
        phase: 'late',
        targetMinutes: 7,
        minimumAge: 32
    }
]);

const BY_ID = new Map(CAREER_QUESTIONS.map(item => [item.id, item]));

export function getCareerQuestion(id) {
    return BY_ID.get(id) || CAREER_QUESTIONS[0];
}

export function getNextCareerQuestion(id) {
    const current = getCareerQuestion(id);
    return CAREER_QUESTIONS.find(item => item.order === current.order + 1) || current;
}

export default CAREER_QUESTIONS;
