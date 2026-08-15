// state/selectors.js
// Accès en lecture aux morceaux du state utilisés par l'application.
// Les selectors évitent que l'UI et les systèmes connaissent tous les détails
// de la structure interne de la sauvegarde.

export const Selectors = {
    player(state) {
        return state?.player || null;
    },

    career(state) {
        return state?.career || null;
    },

    calendar(state) {
        return state?.calendar || null;
    },

    world(state) {
        return state?.world || null;
    },

    social(state) {
        return state?.social || null;
    },

    media(state) {
        return state?.media || null;
    },

    trainingFocus(state) {
        return state?.trainingFocus || null;
    },

    pendingInteraction(state) {
        if (!state) return null;

        if (state.pendingEvent) {
            return { type: 'event', value: state.pendingEvent };
        }

        if (state.pendingCoachEvent) {
            return { type: 'coach', value: state.pendingCoachEvent };
        }

        if (state.pendingMediaDilemma) {
            return { type: 'media', value: state.pendingMediaDilemma };
        }

        if (state.pendingTransferOffer) {
            return { type: 'transfer', value: state.pendingTransferOffer };
        }

        if (state.pendingPositionProposal) {
            return { type: 'position', value: state.pendingPositionProposal };
        }

        return null;
    },

    playerClub(state) {
        const player = state?.player;
        if (!player) return null;

        return {
            id: player.clubId || null,
            name: player.club || null,
            country: player.clubCountry || null,
            level: player.clubLevel || null,
            prestige: player.clubPrestige || null
        };
    }
};

export default Selectors;
