// ui/career/careerHubPresenter.js
// Projection de présentation uniquement : aucun calcul métier ni mutation du State.

const text = value => String(value ?? '').trim();
const category = item => text(item?.category || item?.type).toLowerCase();

function visibleSignals(state = {}) {
    const source = Array.isArray(state.notifications)
        ? state.notifications
        : (state.notifications?.signals || []);
    return source.filter(item => item && !item.archived);
}

function latestSignal(state, predicate = () => true) {
    return [...visibleSignals(state)].reverse().find(predicate) || null;
}

function fixtureLabel(fixture = {}) {
    const opponent = text(fixture.opponent || fixture.opponentName || fixture.awayClub || fixture.homeClub) || 'Adversaire';
    const competition = text(fixture.competitionName || fixture.competition || fixture.round || fixture.phase);
    return { opponent, competition };
}

export function findNextCareerFixture(state = {}) {
    const calendar = state.calendar || {};
    const schedule = calendar.seasonSchedule;
    if (!Array.isArray(schedule?.matches)) return null;

    const currentMonth = Number(calendar.currentMonth) || 1;
    const remaining = schedule.matches
        .filter(match => match && !match.played && String(match.status || '').toLowerCase() !== 'played')
        .sort((a, b) => {
            const monthA = Number(a.month) || currentMonth;
            const monthB = Number(b.month) || currentMonth;
            const distanceA = monthA >= currentMonth ? monthA - currentMonth : 12 - currentMonth + monthA;
            const distanceB = monthB >= currentMonth ? monthB - currentMonth : 12 - currentMonth + monthB;
            return distanceA - distanceB;
        });
    return remaining[0] || null;
}

export function resolveCurrentSituation(state = {}) {
    const player = state.player || {};

    if (state.pendingTransferOffer) {
        const club = text(state.pendingTransferOffer.club || state.pendingTransferOffer.clubName) || 'un autre club';
        return {
            tone: 'decision',
            eyebrow: 'AVENIR',
            title: `Une décision t’attend avec ${club}`,
            detail: 'Ton prochain choix peut changer directement la trajectoire de ta carrière.'
        };
    }

    if (state.pendingPositionProposal) {
        return {
            tone: 'decision',
            eyebrow: 'COACH',
            title: 'Le coach veut parler de ton poste',
            detail: text(state.pendingPositionProposal.message) || 'Une décision sportive est en attente.'
        };
    }

    const important = latestSignal(state, signal => {
        const value = category(signal);
        return /coach|match|medical|bless|transfer|mercato|family|famille|event/.test(value) && !signal.read;
    });
    if (important) {
        return {
            tone: 'active',
            eyebrow: 'SITUATION',
            title: text(important.title) || 'Quelque chose a changé autour de toi',
            detail: text(important.body || important.message || important.description)
        };
    }

    const squadStatus = text(player.squadStatus) || (Number(player.age) < 18 ? 'En formation' : 'Dans le groupe');
    return {
        tone: 'stable',
        eyebrow: 'TA PLACE',
        title: squadStatus,
        detail: text(player.club) ? `Tu poursuis ta progression à ${player.club}.` : 'Ta trajectoire continue de se construire.'
    };
}

export function resolveNextChallenge(state = {}) {
    if (state.pendingTransferOffer) {
        const club = text(state.pendingTransferOffer.club || state.pendingTransferOffer.clubName) || 'un club';
        return { kind: 'decision', title: `Répondre à ${club}`, detail: 'Une offre officielle attend ta décision.' };
    }
    if (state.pendingCoachEvent) {
        return {
            kind: 'decision',
            title: text(state.pendingCoachEvent.title) || 'Discussion avec le coach',
            detail: text(state.pendingCoachEvent.description || state.pendingCoachEvent.message) || 'Le coach attend ta réponse.'
        };
    }
    if (state.pendingEvent) {
        return {
            kind: 'decision',
            title: text(state.pendingEvent.title) || 'Une décision t’attend',
            detail: text(state.pendingEvent.description || state.pendingEvent.message)
        };
    }

    const fixture = findNextCareerFixture(state);
    if (fixture) {
        const { opponent, competition } = fixtureLabel(fixture);
        const categoryLabel = text(state.calendar?.seasonSchedule?.category);
        const detail = [competition, categoryLabel].filter(Boolean).join(' · ');
        return {
            kind: fixture.playable ? 'match' : 'fixture',
            title: `Prochain match : ${opponent}`,
            detail: detail || 'La prochaine échéance sportive de ta carrière.'
        };
    }

    const period = text(state.calendar?.currentPeriod) || 'Période de carrière';
    return { kind: 'period', title: period, detail: 'Continue pour faire avancer cette période.' };
}

export function buildCareerHubModel(state = {}, journalEntries = []) {
    const player = state.player || {};
    const signals = visibleSignals(state).filter(signal => !/media|média|social|réseau/.test(category(signal)));
    const unreadSignals = signals.filter(signal => !signal.read);
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
        nextChallenge: resolveNextChallenge(state),
        journal,
        signals: [...signals].slice(-8).reverse(),
        unreadCount: unreadSignals.length,
        careerEnded: Boolean(player.careerEnded)
    };
}

export default buildCareerHubModel;
