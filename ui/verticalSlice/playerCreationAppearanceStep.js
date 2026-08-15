import { createPlayerCreationDraft } from './playerCreationDraft.js';

export const FACE_OPTIONS = Object.freeze([
    Object.freeze({ id: 'face-01', label: 'Visage 01' }),
    Object.freeze({ id: 'face-02', label: 'Visage 02' }),
    Object.freeze({ id: 'face-03', label: 'Visage 03' }),
    Object.freeze({ id: 'face-04', label: 'Visage 04' }),
    Object.freeze({ id: 'face-05', label: 'Visage 05' }),
    Object.freeze({ id: 'face-06', label: 'Visage 06' })
]);

export const APPEARANCE_COPY = Object.freeze({
    eyebrow: 'Ton visage',
    title: 'Choisis ton visage',
    notice: 'Choisie bien !\navec le temps les visage évolue.',
    continueLabel: 'Continuer'
});

function draftFrom(input = {}) {
    if (input?.draft) return input.draft;
    return createPlayerCreationDraft(input);
}

export function createAppearanceStepState(input = {}) {
    return Object.freeze({
        ...(input?.draft ? input : {}),
        draft: draftFrom(input),
        step: 'appearance',
        screenIndex: 2,
        screenCount: 6
    });
}

export function selectAppearanceFace(state, faceId) {
    if (!FACE_OPTIONS.some(face => face.id === faceId)) {
        throw new Error(`Visage inconnu : ${faceId}`);
    }

    return Object.freeze({
        ...state,
        draft: {
            ...state.draft,
            faceId
        }
    });
}

export function appearanceValidation(state) {
    const faceId = state?.draft?.faceId ?? null;
    const valid = FACE_OPTIONS.some(face => face.id === faceId);

    return Object.freeze({
        valid,
        errors: Object.freeze(valid ? {} : { faceId: 'Visage requis.' })
    });
}

export function appearanceViewModel(state) {
    const validation = appearanceValidation(state);
    const selectedFaceId = state?.draft?.faceId ?? null;

    return Object.freeze({
        step: 'appearance',
        progress: Object.freeze({ current: 2, total: 6, ratio: 2 / 6 }),
        copy: APPEARANCE_COPY,
        selectedFaceId,
        faces: FACE_OPTIONS.map(face => Object.freeze({
            ...face,
            selected: face.id === selectedFaceId
        })),
        canContinue: validation.valid,
        errors: validation.errors
    });
}

export function continueFromAppearance(state) {
    const validation = appearanceValidation(state);
    if (!validation.valid) {
        return Object.freeze({ ok: false, state, errors: validation.errors });
    }

    return Object.freeze({
        ok: true,
        nextStep: 'body',
        state: Object.freeze({
            ...state,
            step: 'body',
            screenIndex: 3
        })
    });
}
