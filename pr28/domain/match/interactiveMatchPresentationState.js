export const MATCH_CAMERA_STATE = Object.freeze({
    NORMAL: 'NORMAL',
    BUILD_UP: 'BUILD_UP',
    COUNTER_ATTACK: 'COUNTER_ATTACK',
    DANGER: 'DANGER',
    DUEL: 'DUEL',
    SHOT: 'SHOT',
    GOAL: 'GOAL',
    SET_PIECE: 'SET_PIECE'
});

const STATES = new Set(Object.values(MATCH_CAMERA_STATE));
const clampIntensity = value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)));

export function resolveInteractiveMatchPresentation(values = {}) {
    const playerControlled = values.playerControlled ?? values.kind === 'decision';
    const explicit = String(values.cameraState || '').toUpperCase();
    if (STATES.has(explicit)) {
        return {
            cameraState: explicit,
            emotionalIntensity: clampIntensity(values.emotionalIntensity),
            visualFocus: values.visualFocus || 'ball',
            playerControlled
        };
    }

    const phase = String(values.phase || '').toLowerCase();
    const headline = `${values.label || ''} ${values.title || ''}`.toLowerCase();
    const copy = `${headline} ${values.text || ''}`.toLowerCase();
    let cameraState = MATCH_CAMERA_STATE.NORMAL;
    let emotionalIntensity = 0;
    let visualFocus = 'ball';

    // GOAL doit provenir d'un fait canonique explicite, jamais d'un simple texte de présentation.
    if (phase === 'goal' || values.goalConfirmed === true) {
        cameraState = MATCH_CAMERA_STATE.GOAL;
        emotionalIntensity = 3;
        visualFocus = 'scorer';
    } else if (/penalty|coup franc|corner|coup de pied arrêté/.test(copy)) {
        cameraState = MATCH_CAMERA_STATE.SET_PIECE;
        emotionalIntensity = 2;
        visualFocus = 'set-piece';
    } else if (phase === 'kickoff') {
        cameraState = MATCH_CAMERA_STATE.BUILD_UP;
    } else if (values.kind === 'decision' && /occasion de but/.test(copy)) {
        cameraState = MATCH_CAMERA_STATE.DANGER;
        emotionalIntensity = 2;
        visualFocus = 'danger-zone';
    } else if (phase.startsWith('consequence') && /frappe|tir|volée|piqu|lob|finition/.test(copy)) {
        cameraState = MATCH_CAMERA_STATE.SHOT;
        emotionalIntensity = 2;
        visualFocus = 'shot-line';
    } else if (/duel|vis-à-vis|défenseur|contact|tacle|interception/.test(copy)) {
        cameraState = MATCH_CAMERA_STATE.DUEL;
        emotionalIntensity = 1;
        visualFocus = 'duel';
    } else if (phase === 'unexpected_event' && /espace|transition|contre/.test(copy)) {
        cameraState = MATCH_CAMERA_STATE.COUNTER_ATTACK;
        emotionalIntensity = 1;
        visualFocus = 'open-space';
    } else if (values.kind === 'decision' || phase === 'unexpected_event') {
        cameraState = MATCH_CAMERA_STATE.BUILD_UP;
        emotionalIntensity = values.kind === 'decision' ? 1 : 0;
    } else if (phase === 'final_whistle' || phase === 'reactions') {
        emotionalIntensity = 1;
        visualFocus = 'player';
    }

    return { cameraState, emotionalIntensity, visualFocus, playerControlled };
}

export default resolveInteractiveMatchPresentation;
