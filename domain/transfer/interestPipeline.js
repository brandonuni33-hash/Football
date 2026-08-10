// domain/transfer/interestPipeline.js
// Transforme progressivement un intérêt club en contact puis en proposition.
// Aucune dépendance UI.

import { EventBus } from '../../core/eventBus.js';
import EVENTS from '../../core/events.js';

const STAGES = Object.freeze({
    EXPLORATORY: 'exploratory',
    SERIOUS: 'serious',
    CONTACT: 'contact',
    OFFER: 'offer',
    CLOSED: 'closed'
});

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class TransferInterestPipeline {
    constructor({ eventBus = EventBus } = {}) {
        this.eventBus = eventBus;
    }

    createInterest({ state, player, club, source = 'unknown', evidence = {}, directOffer = false }) {
        const compatibility = clamp(Number(evidence.compatibility ?? 50));
        const clubNeed = clamp(Number(evidence.clubNeed ?? 50));
        const reputation = clamp(Number(evidence.reputation ?? player?.reputation ?? 50));
        const form = clamp(Number(evidence.form ?? 50));
        const network = clamp(Number(evidence.network ?? 0));
        const age = Number(player?.age ?? 18);

        let seriousness = compatibility * 0.30 + clubNeed * 0.25 + reputation * 0.15 + form * 0.15 + network * 0.15;
        if (source === 'scouting') seriousness += 10;
        if (source === 'recommendation') seriousness += 8;
        if (source === 'opportunistic') seriousness += 3;
        if (age < 18) seriousness *= 0.62;
        seriousness = clamp(seriousness);

        const interest = {
            id: `interest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            playerId: player?.id || null,
            clubId: club?.id || null,
            source,
            stage: directOffer ? STAGES.OFFER : seriousness >= 72 ? STAGES.SERIOUS : STAGES.EXPLORATORY,
            seriousness,
            createdAt: new Date().toISOString(),
            evidence: { compatibility, clubNeed, reputation, form, network },
            ageAtCreation: age,
            history: []
        };

        state.transferInterests ||= [];
        state.transferInterests.push(interest);
        this.eventBus.emit(EVENTS.TRANSFER_INTEREST_CREATED, { state, playerId: interest.playerId, clubId: interest.clubId, interest });
        return interest;
    }

    advance({ state, interest, context = {} }) {
        if (!interest || interest.stage === STAGES.CLOSED || interest.stage === STAGES.OFFER) return interest;

        const pressure = clamp(Number(context.performance ?? 50) * 0.30 + Number(context.clubNeed ?? 50) * 0.30 + Number(context.relationship ?? 50) * 0.20 + Number(context.reputation ?? 50) * 0.20);
        interest.seriousness = clamp(interest.seriousness * 0.65 + pressure * 0.35);
        interest.history.push({ stage: interest.stage, at: new Date().toISOString(), pressure });

        if (interest.stage === STAGES.EXPLORATORY && interest.seriousness >= 68) {
            interest.stage = STAGES.SERIOUS;
        } else if (interest.stage === STAGES.SERIOUS && interest.seriousness >= 78) {
            interest.stage = STAGES.CONTACT;
        }

        if (interest.stage === STAGES.CONTACT && interest.seriousness >= 86 && context.allowOffer !== false) {
            interest.stage = STAGES.OFFER;
            this.eventBus.emit(EVENTS.TRANSFER_OFFER_CREATED, {
                state,
                playerId: interest.playerId,
                clubId: interest.clubId,
                interestId: interest.id,
                source: interest.source,
                seriousness: interest.seriousness
            });
        }

        return interest;
    }

    close(interest, reason = 'abandoned') {
        if (!interest) return false;
        interest.stage = STAGES.CLOSED;
        interest.closedAt = new Date().toISOString();
        interest.closeReason = reason;
        return true;
    }
}

export { STAGES as TRANSFER_INTEREST_STAGES };
export default TransferInterestPipeline;
