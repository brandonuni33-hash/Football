import test from 'node:test';
import assert from 'node:assert/strict';

import {
    CAREER_QUESTION_IDS,
    CAREER_QUESTIONS
} from '../../domain/career/careerQuestionCatalog.js';
import {
    evaluateCareerDirector,
    inferCareerQuestion
} from '../../domain/career/careerDirector.js';
import {
    CAREER_PACE,
    evaluateCareerPace
} from '../../domain/career/careerPacingDirector.js';

test('les 11 questions forment une progression ordonnée et commencent à 14 ans', () => {
    assert.equal(CAREER_QUESTIONS.length, 11);
    assert.deepEqual(CAREER_QUESTIONS.map(item => item.order), [1,2,3,4,5,6,7,8,9,10,11]);
    assert.equal(CAREER_QUESTIONS[0].minimumAge, 14);
    assert.match(CAREER_QUESTIONS[0].question, /personne ne te connaît/i);
});

test('un joueur de 14 ans sans preuve reste dans la première question', () => {
    const question = inferCareerQuestion({ player: { age: 14 } });
    assert.equal(question.id, CAREER_QUESTION_IDS.UNKNOWN_SELF);
});

test('un premier accès senior fait passer à la question du monde pro sans dépendre uniquement de l âge', () => {
    const question = inferCareerQuestion({
        player: { age: 17, seniorAppearances: 1 }
    });
    assert.equal(question.id, CAREER_QUESTION_IDS.EXIST_AS_PRO);
});

test('un joueur pro installé atteint les questions de statut', () => {
    const question = inferCareerQuestion({
        player: { age: 25, isProfessional: true, seniorAppearances: 60 }
    });
    assert.equal(question.id, CAREER_QUESTION_IDS.LIVE_WITH_STATUS);
});

test('le Career Director ne mutile pas l état source et rend un nouvel état de progression', () => {
    const state = {
        player: { age: 17, seniorAppearances: 1 },
        careerDirector: {
            questionId: CAREER_QUESTION_IDS.EARN_PLACE,
            enteredAtAge: 15,
            answeredQuestionIds: [],
            version: 1
        }
    };
    const before = JSON.stringify(state);
    const result = evaluateCareerDirector(state);
    assert.equal(JSON.stringify(state), before);
    assert.equal(result.advanced, true);
    assert.equal(result.question.id, CAREER_QUESTION_IDS.EXIST_AS_PRO);
    assert.ok(result.state.answeredQuestionIds.includes(CAREER_QUESTION_IDS.EARN_PLACE));
});

test('un entraînement ordinaire reste invisible', () => {
    const result = evaluateCareerPace({ type: 'training' });
    assert.equal(result.pace, CAREER_PACE.SKIP);
    assert.equal(result.shouldInterrupt, false);
});

test('un changement de rôle mérite une scène mais une répétition récente peut être condensée', () => {
    const first = evaluateCareerPace({ type: 'role_change', statusChanged: true });
    assert.equal(first.pace, CAREER_PACE.SCENE);
    assert.equal(first.shouldInterrupt, true);

    const repeated = evaluateCareerPace(
        { type: 'role_change' },
        { similarRecentCount: 3, sameTypeThisSeason: 2 }
    );
    assert.ok([CAREER_PACE.SKIP, CAREER_PACE.GLIMPSE].includes(repeated.pace));
});

test('premier contrat pro et dernier match sont des landmarks', () => {
    assert.equal(evaluateCareerPace({ type: 'pro_contract', firstTime: true }).pace, CAREER_PACE.LANDMARK);
    assert.equal(evaluateCareerPace({ type: 'last_match' }).pace, CAREER_PACE.LANDMARK);
});

test('une performance devient importante par son écart aux attentes, pas par le potentiel', () => {
    const ordinary = evaluateCareerPace({ type: 'performance', expectationGap: 0 });
    const unexpected = evaluateCareerPace({ type: 'performance', expectationGap: 25, personalRecord: true, decisive: true });
    assert.ok(unexpected.score > ordinary.score);
    assert.equal('potential' in unexpected, false);
});
