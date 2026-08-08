// state.js
const STORAGE_KEY = 'fc_career_save_v2.0';

let state = {
    isCreated: false,
    player: null,
    career: { age: 14, week: 1, season: 1, balance: 0, salary: 0, fame: 0 }
};

export const StateManager = {
    load: () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) state = JSON.parse(saved);
        } catch (e) { console.error("Erreur lors du chargement de la sauvegarde", e); }
        return state;
    },
    save: () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) { console.error("Erreur lors de la sauvegarde", e); }
    },
    get: () => state,
    update: (updates) => {
        state = { ...state, ...updates };
        StateManager.save();
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: state }));
    }
};
