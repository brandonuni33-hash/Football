// domain/notification/notificationSystem.js
// Transforme les faits du monde en signaux de carrière.
// Le domaine ne connaît jamais l'UI ni la totalité du state.

import { EventBus } from '../../core/eventBus.js';
import EVENTS from '../../core/events.js';

const PRIORITY = Object.freeze({ feed: 20, toast: 40, important: 65, decision: 85, scene: 100 });
const VISIBILITY = Object.freeze({ hidden: 'hidden', indirect: 'indirect', visible: 'visible', confirmed: 'confirmed' });
function now() { return new Date().toISOString(); }
function createId(prefix = 'signal') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function serializablePayload(payload = {}) {
    if (!payload || typeof payload !== 'object') return {};
    const { state, ...safePayload } = payload;
    return safePayload;
}
function relationshipDescriptor(payload = {}) {
    const relation = String(payload.relation || '').toLowerCase();
    const advice = String(payload.advice || '').trim();
    if (relation === 'coach') return {
        category: 'coach', priority: 'toast', intent: 'coach',
        title: advice ? `Le coach vous laisse avec une idée : ${advice}` : 'Le coach veut que vous reteniez quelque chose',
        body: advice
            ? `Votre dernier échange avec le coach se termine sur une impression claire : ${advice.toLowerCase()}.`
            : 'Votre échange avec le coach laisse une trace dans votre relation.'
    };
    if (['family', 'famille', 'parent', 'partner', 'frère', 'soeur', 'sœur'].includes(relation)) return {
        category: 'famille', priority: 'toast', intent: 'family',
        title: 'Un proche prend de vos nouvelles',
        body: advice ? `Dans votre entourage, un proche vous glisse simplement : « ${advice} ». ` : 'Un échange personnel vient de compter dans votre vie hors du terrain.'
    };
    return {
        category: 'relation', priority: 'toast', intent: 'conversation',
        title: 'Une relation évolue',
        body: advice ? `Un échange se termine sur cette impression : ${advice}.` : 'Une relation importante de votre entourage vient d’évoluer.'
    };
}

export class NotificationSystem {
    constructor({ state = null, engine = null, eventBus = EventBus } = {}) {
        this.state = state;
        this.engine = engine;
        this.eventBus = eventBus;
        this.unsubscribers = [];
        this.started = false;
    }
    start() { this.init(); }
    init() {
        if (this.started) this.destroy();
        this.#on('family.child_born', payload => {
            const child = payload?.child || {};
            const isBoy = child.gender === 'male';
            this.#signal(payload, { category: 'famille', priority: 'important', title: isBoy ? 'Un fils vient de naître' : 'Un enfant vient de naître', body: isBoy ? `${child.firstName || 'Votre fils'} vient agrandir votre famille. Cette naissance pourra ouvrir une nouvelle génération plus tard.` : `${child.firstName || 'Votre enfant'} vient agrandir votre famille.`, intent: 'family', visibility: VISIBILITY.confirmed });
        });
        this.#on(EVENTS.SCOUTING_OBSERVATION_STARTED, payload => this.#scoutingObservation(payload));
        this.#on(EVENTS.SCOUTING_OBSERVATION_COMPLETED, payload => this.#scoutingCompleted(payload));
        this.#on(EVENTS.SCOUTING_INTEREST_CREATED, payload => this.#signal(payload, { category: 'scouting', priority: 'important', title: 'Un club suit votre progression', body: 'Un intérêt vient d’être enregistré autour de votre profil.', intent: 'evaluate' }));
        this.#on(EVENTS.TRANSFER_INTEREST_CREATED, payload => this.#transferInterest(payload));
        this.#on(EVENTS.TRANSFER_OFFER_CREATED, payload => this.#signal(payload, { category: 'mercato', priority: 'decision', title: 'Une proposition vous attend', body: `Une nouvelle proposition officielle de ${payload?.club || 'club'} est disponible.`, intent: 'offer', visibility: VISIBILITY.confirmed }));
        this.#on(EVENTS.LOAN_PROPOSAL_CREATED, payload => this.#signal(payload, { category: 'mercato', priority: 'decision', title: 'Une proposition de prêt est arrivée', body: 'Une solution de prêt est désormais disponible.', intent: 'loan' }));
        this.#on(EVENTS.CONTRACT_EXPIRING, payload => this.#signal(payload, { category: 'contract', priority: 'important', title: 'Votre contrat arrive à échéance', body: 'Votre avenir contractuel mérite désormais votre attention.', intent: 'contract' }));
        this.#on(EVENTS.AGENT_INTEREST_CREATED, payload => this.#signal(payload, { category: 'agent', priority: 'important', title: 'Un agent s’intéresse à vous', body: 'Un représentant souhaite entrer en contact avec votre entourage.', intent: 'agent' }));
        this.#on(EVENTS.RELATIONSHIP_ADVICE, payload => this.#signal(payload, relationshipDescriptor(payload)));
        this.#on(EVENTS.MEDIA_POST_CREATED, payload => {
            if (!payload?.post) return;
            this.#signal(payload, { category: 'media', priority: 'feed', title: payload.post.source || 'Une publication parle de vous', body: payload.post.content || 'Une nouvelle réaction médiatique vient d’apparaître.', intent: 'media' });
        });
        this.started = true;
    }
    stop() { this.destroy(); }
    destroy() { this.unsubscribers.splice(0).forEach(unsubscribe => unsubscribe?.()); this.started = false; }
    #on(eventName, handler) { this.unsubscribers.push(this.eventBus.on(eventName, handler)); }
    #state(payload) { return payload?.state || this.engine?.state || this.state || null; }
    #scoutingObservation(payload = {}) {
        const age = Number(payload.age ?? payload.playerAge ?? 18);
        const young = age >= 14 && age < 18;
        this.#signal(payload, { category: 'scouting', priority: young ? 'toast' : 'important', title: young ? 'Un observateur est présent' : 'Un recruteur vous observe', body: young ? 'Un observateur prend des notes depuis les tribunes. Votre entourage pense qu’il s’agit d’un recruteur.' : 'Un recruteur professionnel suit attentivement votre prestation.', intent: 'observe', visibility: payload.visibility || (young ? VISIBILITY.indirect : VISIBILITY.visible) });
    }
    #scoutingCompleted(payload = {}) { this.#signal(payload, { category: 'scouting', priority: 'important', title: 'Le suivi continue', body: 'Un rapport sur votre profil vient d’être finalisé. Cela ne signifie pas encore qu’une offre arrivera.', intent: 'report', visibility: VISIBILITY.indirect }); }
    #transferInterest(payload = {}) {
        const interest = payload.interest || {};
        const serious = interest.stage === 'serious' || Number(interest.seriousness) >= 72;
        this.#signal(payload, { category: 'mercato', priority: serious ? 'important' : 'toast', title: serious ? 'Un intérêt devient concret' : 'Des renseignements sont pris sur vous', body: serious ? 'Un club semble désormais suivre votre situation avec davantage d’attention.' : 'Des bruits circulent autour de votre profil, sans proposition officielle à ce stade.', intent: 'interest', visibility: VISIBILITY.indirect });
    }
    #signal(payload = {}, descriptor = {}) {
        const priority = descriptor.priority || 'feed';
        const signal = { id: createId(), threadId: payload.threadId || createId('thread'), createdAt: now(), category: descriptor.category || 'career', priority, priorityScore: PRIORITY[priority] ?? PRIORITY.feed, title: descriptor.title || 'Nouvelle activité', body: descriptor.body || '', intent: descriptor.intent || 'inform', visibility: descriptor.visibility || VISIBILITY.visible, confidence: Number.isFinite(payload.confidence) ? payload.confidence : 1, source: payload.source || payload.clubId || payload.agentId || 'world', actorId: payload.actorId || payload.scoutId || payload.agentId || null, playerId: payload.playerId || null, clubId: payload.clubId || null, actionable: ['decision', 'scene'].includes(priority), read: false, archived: false, payload: serializablePayload(payload) };
        this.#append(signal, payload); this.eventBus.emit('notification.created', signal); return signal;
    }
    #append(signal, payload) {
        const state = this.#state(payload); if (!state) return;
        state.notifications ||= { signals: [], threads: [], unreadCount: 0 }; state.notifications.signals ||= []; state.notifications.threads ||= [];
        state.notifications.signals.push(signal); if (!signal.read) state.notifications.unreadCount = (state.notifications.unreadCount || 0) + 1;
        let thread = state.notifications.threads.find(item => item.id === signal.threadId);
        if (!thread) { thread = { id: signal.threadId, category: signal.category, title: signal.title, createdAt: signal.createdAt, updatedAt: signal.createdAt, signalIds: [] }; state.notifications.threads.push(thread); }
        thread.updatedAt = signal.createdAt; thread.signalIds.push(signal.id);
    }
    markRead(state, signalId) { const signal = state?.notifications?.signals?.find(item => item.id === signalId); if (!signal || signal.read) return false; signal.read = true; state.notifications.unreadCount = Math.max(0, (state.notifications.unreadCount || 0) - 1); return true; }
    archive(state, signalId) { const signal = state?.notifications?.signals?.find(item => item.id === signalId); if (!signal) return false; signal.archived = true; return true; }
}
export default NotificationSystem;
