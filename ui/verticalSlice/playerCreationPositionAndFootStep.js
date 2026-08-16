import { createPlayerCreationDraft, PREFERRED_FEET } from './playerCreationDraft.js';

export const POSITION_OPTIONS = Object.freeze([
    Object.freeze({ id: 'GB', label: 'Gardien', group: 'goalkeeper' }),
    Object.freeze({ id: 'DG', label: 'Défenseur gauche', group: 'defence' }),
    Object.freeze({ id: 'DC', label: 'Défenseur central', group: 'defence' }),
    Object.freeze({ id: 'DD', label: 'Défenseur droit', group: 'defence' }),
    Object.freeze({ id: 'MDC', label: 'Milieu défensif', group: 'midfield' }),
    Object.freeze({ id: 'MC', label: 'Milieu central', group: 'midfield' }),
    Object.freeze({ id: 'MOC', label: 'Milieu offensif', group: 'midfield' }),
    Object.freeze({ id: 'AG', label: 'Ailier gauche', group: 'attack' }),
    Object.freeze({ id: 'BU', label: 'Buteur', group: 'attack' }),
    Object.freeze({ id: 'AD', label: 'Ailier droit', group: 'attack' })
]);

export const POSITION_AND_FOOT_COPY = Object.freeze({
    eyebrow: 'Poste',
    title: 'Où tu te sens le mieux ?',
    footLabel: 'Pied fort',
    continueLabel: 'Continuer'
});

function draftFrom(input = {}) {
    if (input?.draft) return input.draft;
    return createPlayerCreationDraft(input);
}

export function createPositionAndFootStepState(input = {}) {
    return Object.freeze({
        ...(input?.draft ? input : {}),
        draft: draftFrom(input),
        step: 'positionAndFoot',
        screenIndex: 4,
        screenCount: 6
    });
}

export function selectPosition(state, position) {
    if (!POSITION_OPTIONS.some(option => option.id === position)) {
        throw new Error(`Poste inconnu : ${position}`);
    }
    return Object.freeze({ ...state, draft: { ...state.draft, position } });
}

export function selectPreferredFoot(state, preferredFoot) {
    if (!PREFERRED_FEET.includes(preferredFoot)) {
        throw new Error(`Pied fort inconnu : ${preferredFoot}`);
    }
    return Object.freeze({ ...state, draft: { ...state.draft, preferredFoot } });
}

export function positionAndFootValidation(state) {
    const errors = {};
    const position = state?.draft?.position ?? null;
    const preferredFoot = state?.draft?.preferredFoot ?? null;

    if (!POSITION_OPTIONS.some(option => option.id === position)) errors.position = 'Poste requis.';
    if (!PREFERRED_FEET.includes(preferredFoot)) errors.preferredFoot = 'Pied fort requis.';

    return Object.freeze({ valid: Object.keys(errors).length === 0, errors: Object.freeze(errors) });
}

export function positionAndFootViewModel(state) {
    const validation = positionAndFootValidation(state);
    const selectedPosition = state?.draft?.position ?? null;
    const preferredFoot = state?.draft?.preferredFoot ?? null;

    return Object.freeze({
        step: 'positionAndFoot',
        progress: Object.freeze({ current: 4, total: 6, ratio: 4 / 6 }),
        copy: POSITION_AND_FOOT_COPY,
        selectedPosition,
        preferredFoot,
        positions: POSITION_OPTIONS.map(option => Object.freeze({ ...option, selected: option.id === selectedPosition })),
        feet: Object.freeze([
            Object.freeze({ id: 'RIGHT', label: 'Droit', selected: preferredFoot === 'RIGHT' }),
            Object.freeze({ id: 'LEFT', label: 'Gauche', selected: preferredFoot === 'LEFT' })
        ]),
        canContinue: validation.valid,
        errors: validation.errors
    });
}

export function continueFromPositionAndFoot(state) {
    const validation = positionAndFootValidation(state);
    if (!validation.valid) return Object.freeze({ ok: false, state, errors: validation.errors });

    return Object.freeze({
        ok: true,
        nextStep: 'nationalities',
        state: Object.freeze({ ...state, step: 'nationalities', screenIndex: 5 })
    });
}
