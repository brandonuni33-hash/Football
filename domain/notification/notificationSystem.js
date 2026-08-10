// domain/notification/notificationSystem.js
// Transforme les faits du monde en signaux de carrière.
// Le domaine ne connaît jamais l'UI.

import { EventBus } from '../../core/eventBus.js';
import EVENTS from '../../core/events.js';

const PRIORITY = Object.freeze({ feed: 20, toast: 40, important: 65, decision: 85, scene: 100 });
const VISIBILITY = Object.freeze({ hidden: 'hidden', indirect: 'indirect', visible: 'visible', confirmed: 'confirmed' });

function now() { return new Date().toISOString(); }
function createId(prefix = 'signal') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

export class NotificationSystem {
    constructor({ state = null, eventBus = EventBus } = {}) {
        this.state = state;
        this.eventBus = eventBus;
        this.unsubscribers = [];
        this.started = false;
    }

    start() { this.init(); }

    init() {
        if (this.started) this.destroy();
        this.#on(EVENTS.SCOUTING_OBSERVATION_STARTED, payload => this.#scoutingObservation(payload));
        this.#on(EVENTS.SCOUTING_OBSERVATION_COMPLETED, payload => this.#scoutingCompleted(payload));
        this.#on(EVENTS.SCOUTING_INTEREST_CREATED, payload => this.#signal(payload, {
            category: 'scouting', priority: 'important', title: 'Un club suit votre progression',
            body: 'Un intérêt vient d’être enregistré autour de votre profil.', intent: 'evaluate'
        }));
        this.#on(EVENTS.TRANSFER_OFFER_CREATED, payload => this.#signal(payload, {
            category: 'mercato', priority: 'decision', title: 'Une proposition vous attend',
            body: 'Une nouvelle proposition officielle est disponible.', intent: 'offer'
        }));
        this.#on(EVENTS.LOAN_PROPOSAL_CREATED, payload => this.#signal(payload, {
            category: 'mercato', priority: 'decision', title: 'Une proposition de prêt est arrivée',
            body: 'Une solution de prêt est désormais disponible.', intent: 'loan'
        }));
        this.#on(EVENTS.CONTRACT_EXPIRING, payload => this.#signal(payload, {
            category: 'contract', priority: 'important', title: 'Votre contrat arrive à échéance',
            body: 'Votre avenir contractuel mérite désormais votre attention.', intent: 'contract'
        }));
        this.#on(EVENTS.AGENT_INTEREST_CREATED, payload => this.#signal(payload, {
            category: 'agent', priority: 'important', title: 'Un agent s’intéresse à vous',
            body: 'Un représentant souhaite entrer en contact avec votre entourage.', intent: 'agent'
        }));
        this.#on(EVENTS.RELATIONSHIP_ADVICE, payload => this.#signal(payload, {
            category: 'relation', priority: 'toast', title: 'Quelqu’un souhaite vous parler',
            body: 'Une personne de votre entourage vous a laissé un conseil.', intent: 'conversation'
        }));
        this.#on(EVENTS.MEDIA_POST_CREATED, payload => this.#signal(payload, {
            category: 'media', priority: 'feed', title: 'Une nouvelle publication parle de vous',
            body: 'Une nouvelle réaction médiatique vient d’apparaître.', intent: 'media'
        }));
        this.started = true;
    }

    stop() { this.destroy(); }

    destroy() {
        this.unsubscribers.splice(0).forEach(unsubscribe => unsubscribe?.());
        this.started = false;
    }

    #on(eventName, handler) { this.unsubscribers.push(this.eventBus.on(eventName, handler)); }

    #state(payload) { return payload?.state || this.state; }

    #scoutingObservation(payload = {}) {
        const age = Number(payload.age ?? payload.playerAge ?? 18);
        const young = age >= 14 && age < 18;
        this.#signal(payload, {
            category: 'scouting', priority: young ? 'toast' : 'important',
            title: young ? 'Un observateur est présent' : 'Un recruteur vous observe',
            body: young
                ? 'Un observateur prend des notes depuis les tribunes. Votre entourage pense qu’il s’agit d’un recruteur.'
                : 'Un recruteur professionnel suit attentivement votre prestation.',
            intent: 'observe', visibility: payload.visibility || (young ? VISIBILITY.indirect : VISIBILITY.visible)
        });
    }

    #scoutingCompleted(payload = {}) {
        this.#signal(payload, {
            category: 'scouting', priority: 'important', title: 'Rapport de scouting terminé',
            body: 'Un rapport sur votre profil vient d’être finalisé.', intent: 'report'
        });
    }

    #signal(payload = {}, descriptor = {}) {
        const priority = descriptor.priority || 'feed';
        const signal = {
            id: createId(),
            threadId: payload.threadId || createId('thread'),
            createdAt: now(),
            category: descriptor.category || 'career',
            priority,
            priorityScore: PRIORITY[priority] ?? PRIORITY.feed,
            title: descriptor.title || 'Nouvelle activité',
            body: descriptor.body || '',
            intent: descriptor.intent || 'inform',
            visibility: descriptor.visibility || VISIBILITY.visible,
            confidence: Number.isFinite(payload.confidence) ? payload.confidence : 1,
            source: payload.source || payload.clubId || payload.agentId || 'world',
            actorId: payload.actorId || payload.scoutId || payload.agentId || null,
            playerId: payload.playerId || null,
            clubId: payload.clubId || null,
            actionable: ['decision', 'scene'].includes(priority),
            read: false,
            archived: false,
            payload: { ...payload }
        };
        this.#append(signal, payload);
        this.eventBus.emit('notification.created', signal);
        return signal;
    }

    #append(signal, payload) {
        const state = this.#state(payload);
        if (!state) return;
        state.notifications ||= { signals: [], threads: [], unreadCount: 0 };
        state.notifications.signals ||= [];
        state.notifications.threads ||= [];
        state.notifications.signals.push(signal);
        if (!signal.read) state.notifications.unreadCount = (state.notifications.unreadCount || 0) + 1;

        let thread = state.notifications.threads.find(item => item.id === signal.threadId);
        if (!thread) {
            thread = { id: signal.threadId, category: signal.category, title: signal.title,
                createdAt: signal.createdAt, updatedAt: signal.createdAt, signalIds: [] };
            state.notifications.threads.push(thread);
        }
        thread.updatedAt = signal.createdAt;
        thread.signalIds.push(signal.id);
    }

    markRead(state, signalId) {
        const signal = state?.notifications?.signals?.find(item => item.id === signalId);
        if (!signal || signal.read) return false;
        signal.read = true;
        state.notifications.unreadCount = Math.max(0, (state.notifications.unreadCount || 0) - 1);
        return true;
    }

    archive(state, signalId) {
        const signal = state?.notifications?.signals?.find(item => item.id === signalId);
        if (!signal) return false;
        signal.archived = true;
        return true;
    }
}

export default NotificationSystem;
