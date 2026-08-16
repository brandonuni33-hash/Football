import { createPlayerCreationDraft, VERTICAL_SLICE_BODY_LIMITS } from './playerCreationDraft.js';

export const FACE_OPTIONS = Object.freeze([
    Object.freeze({ id: 'face-01', label: 'Visage 01' }),
    Object.freeze({ id: 'face-02', label: 'Visage 02' }),
    Object.freeze({ id: 'face-03', label: 'Visage 03' }),
    Object.freeze({ id: 'face-04', label: 'Visage 04' }),
    Object.freeze({ id: 'face-05', label: 'Visage 05' }),
    Object.freeze({ id: 'face-06', label: 'Visage 06' })
]);

export const BODY_LIMITS = Object.freeze({
    height: Object.freeze({ ...VERTICAL_SLICE_BODY_LIMITS.height, unit: 'cm' }),
    weight: Object.freeze({ ...VERTICAL_SLICE_BODY_LIMITS.weight, unit: 'kg' })
});

export const APPEARANCE_COPY = Object.freeze({
    eyebrow: 'Ton apparence',
    title: 'Crée ton joueur',
    bodyNote: 'À 14 ans, ton corps pourra encore évoluer au fil de la carrière.',
    continueLabel: 'Continuer'
});

function draftFrom(input = {}) {
    if (input?.draft) return input.draft;
    return createPlayerCreationDraft(input);
}

function clamp(value, { min, max }) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, Math.round(numeric)));
}

function ratio(value, limits) {
    return (clamp(value, limits) - limits.min) / (limits.max - limits.min);
}

function round(value, precision = 3) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}

export function createAppearanceStepState(input = {}) {
    return Object.freeze({ ...(input?.draft ? input : {}), draft: draftFrom(input), step: 'appearance', screenIndex: 2, screenCount: 5 });
}

export function selectAppearanceFace(state, faceId) {
    if (!FACE_OPTIONS.some(face => face.id === faceId)) throw new Error(`Visage inconnu : ${faceId}`);
    return Object.freeze({ ...state, draft: { ...state.draft, faceId } });
}

export function updateAppearanceBodyField(state, field, rawValue) {
    if (!['height', 'weight'].includes(field)) throw new Error(`Champ gabarit inconnu : ${field}`);
    return Object.freeze({ ...state, draft: { ...state.draft, [field]: clamp(rawValue, BODY_LIMITS[field]) } });
}

export function appearanceValidation(state) {
    const errors = {};
    const faceId = state?.draft?.faceId ?? null;
    const height = Number(state?.draft?.height);
    const weight = Number(state?.draft?.weight);
    if (!FACE_OPTIONS.some(face => face.id === faceId)) errors.faceId = 'Visage requis.';
    if (!Number.isFinite(height) || height < BODY_LIMITS.height.min || height > BODY_LIMITS.height.max) errors.height = 'Taille invalide.';
    if (!Number.isFinite(weight) || weight < BODY_LIMITS.weight.min || weight > BODY_LIMITS.weight.max) errors.weight = 'Poids invalide.';
    return Object.freeze({ valid: Object.keys(errors).length === 0, errors: Object.freeze(errors) });
}

export function appearanceViewModel(state) {
    const validation = appearanceValidation(state);
    const selectedFaceId = state?.draft?.faceId ?? null;
    const height = Number(state?.draft?.height);
    const weight = Number(state?.draft?.weight);
    const heightRatio = ratio(height, BODY_LIMITS.height);
    const weightRatio = ratio(weight, BODY_LIMITS.weight);
    return Object.freeze({
        step: 'appearance', progress: Object.freeze({ current: 2, total: 5, ratio: 2 / 5 }), copy: APPEARANCE_COPY, selectedFaceId,
        faces: FACE_OPTIONS.map(face => Object.freeze({ ...face, selected: face.id === selectedFaceId })),
        height: Object.freeze({ value: height, ...BODY_LIMITS.height }), weight: Object.freeze({ value: weight, ...BODY_LIMITS.weight }),
        silhouette: Object.freeze({ heightScale: round(0.87 + (0.19 * heightRatio)), torsoWidth: Math.round(52 + (14 * weightRatio)), armWidth: Math.round(15 + (5 * weightRatio)), legWidth: Math.round(21 + (6 * weightRatio)) }),
        canContinue: validation.valid, errors: validation.errors
    });
}

export function continueFromAppearance(state) {
    const validation = appearanceValidation(state);
    if (!validation.valid) return Object.freeze({ ok: false, state, errors: validation.errors });
    return Object.freeze({ ok: true, nextStep: 'positionAndFoot', state: Object.freeze({ ...state, step: 'positionAndFoot', screenIndex: 3 }) });
}
