// state.js
const STORAGE_KEY = 'fc_career_save_v1.0'; // Versioning pour éviter les crashs de schéma

const initialState = {
    isCreated: false,
    player: null,
    career: {
        age: 14,
        phaseIndex: 0,
        week: 1,
        season: 1,
        balance: 0,
        salary: 0,
        fame: 0
    },
    staff: {
        physique: 0,
        technique: 0,
        mental: 0
    }
};

let state = { ...initialState };

export const StateManager = {
    load: () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                state = JSON.parse(saved);
                console.log("Sauvegarde chargée avec succès.");
            }
        } catch (e) {
            console.error("Erreur lors du chargement de la sauvegarde, réinitialisation...", e);
            state = { ...initialState };
        }
        return state;
    },
    save: () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde (Quota dépassé ?)", e);
        }
    },
    get: () => state,
    update: (updates) => {
        state = { ...state, ...updates };
        StateManager.save();
        // Dispatch d'un événement global pour que l'UI se mette à jour
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: state }));
    },
    reset: () => {
        state = { ...initialState };
        StateManager.save();
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: state }));
    }
};
