// ui/career/careerHubPresenter.js
// Projection de présentation uniquement : aucun calcul métier ni mutation du State.

const text = value => String(value ?? '').trim();
const category = item => text(item?.category || item?.type).toLowerCase();

function visibleSignals(state = {}) {
    const source = Array.isArray(state.notifications) ? state.notifications : (state.notifications?.signals || []);
    return source.filter(item => item && !item.archived);
}

function latestSignal(state, predicate = () => true) {
    return [...visibleSignals(state)].reverse().find(predicate) || null;
}

export function resolveCurrentSituation(state = {}) {
    const player = state.player || {};
    if (state.pendingTransferOffer) {
        const club = text(state.pendingTransferOffer.club || state.pendingTransferOffer.clubName) || 'un autre club';
        return { tone:'decision', eyebrow:'AVENIR', title:`Une décision t’attend avec ${club}`, detail:'Ton prochain choix peut changer directement la trajectoire de ta carrière.' };
    }
    if (state.pendingPositionProposal) {
        return { tone:'decision', eyebrow:'COACH', title:'Le coach veut parler de ton poste', detail:text(state.pendingPositionProposal.message) || 'Une décision sportive est en attente.' };
    }
    const important = latestSignal(state, signal => {
        const value = category(signal);
        return /coach|match|medical|bless|transfer|mercato|family|famille|event/.test(value) && !signal.read;
    });
    if (important) return { tone:'active', eyebrow:'SITUATION', title:text(important.title) || 'Quelque chose a changé autour de toi', detail:text(important.body || important.message || important.description) };
    const squadStatus = text(player.squadStatus) || (Number(player.age) < 18 ? 'En formation' : 'Dans le groupe');
    return { tone:'stable', eyebrow:'TA PLACE', title:squadStatus, detail:text(player.club) ? `Tu poursuis ta progression à ${player.club}.` : 'Ta trajectoire continue de se construire.' };
}

export function buildCareerHubModel(state = {}, journalEntries = []) {
    const player = state.player || {};
    const signals = visibleSignals(state).filter(signal => !/media|média|social|réseau/.test(category(signal)));
    const journal = Array.isArray(journalEntries) ? journalEntries.filter(Boolean).slice(0, 8) : [];
    return {
        player: {
            name: text(`${player.firstname || player.firstName || ''} ${player.lastname || player.lastName || ''}`) || 'Joueur',
            age: Number(player.age) || 14,
            club: text(player.club) || 'Sans club',
            position: text(player.position || player.positionId) || 'Joueur',
            fitness: player.fitness ?? player.form ?? player.condition ?? null
        },
        period: text(state.calendar?.currentPeriod) || 'Carrière',
        situation: resolveCurrentSituation(state),
        journal,
        signals: [...signals].slice(-8).reverse(),
        unreadCount: signals.filter(signal => !signal.read).length,
        careerEnded: Boolean(player.careerEnded)
    };
}

export default buildCareerHubModel;
