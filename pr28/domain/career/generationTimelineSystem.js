// domain/career/generationTimelineSystem.js
// Gère le passage du temps entre la retraite du parent et le début de carrière du fils.
// La timeline est persistante : une simulation peut être reprise sans rejouer les années déjà simulées.

const START_AGE = 14;

export class GenerationTimelineSystem {
    ensure(state) {
        state.generationTimeline ||= {
            active: null,
            history: []
        };
        state.generationTimeline.history ||= [];
        return state.generationTimeline;
    }

    begin({ state, playerId, childId, currentAge }) {
        const timeline = this.ensure(state);
        const age = Number(currentAge);
        if (!Number.isFinite(age)) return null;

        timeline.active = {
            parentPlayerId: playerId,
            childId,
            fromAge: age,
            currentAge: age,
            targetAge: START_AGE,
            status: age >= START_AGE ? 'ready' : 'pending',
            startedAt: new Date().toISOString()
        };
        return timeline.active;
    }

    checkpoint({ state, age, summary = {} }) {
        const timeline = this.ensure(state);
        if (!timeline.active) return null;

        timeline.active.currentAge = Number(age);
        timeline.active.status = Number(age) >= START_AGE ? 'ready' : 'pending';
        timeline.active.lastCheckpoint = {
            age: Number(age),
            summary: { ...summary },
            createdAt: new Date().toISOString()
        };
        return timeline.active;
    }

    complete({ state, childId, summary = {} }) {
        const timeline = this.ensure(state);
        if (!timeline.active || timeline.active.childId !== childId) return null;

        timeline.active.currentAge = Math.max(START_AGE, Number(timeline.active.currentAge || 0));
        timeline.active.status = 'ready';
        timeline.active.completedAt = new Date().toISOString();
        timeline.active.summary = { ...summary };
        timeline.history.push({ ...timeline.active });
        const completed = timeline.active;
        timeline.active = null;
        return completed;
    }

    cancel({ state, reason = 'cancelled' }) {
        const timeline = this.ensure(state);
        if (!timeline.active) return null;
        timeline.active.status = 'cancelled';
        timeline.active.cancelReason = reason;
        timeline.history.push({ ...timeline.active, cancelledAt: new Date().toISOString() });
        const cancelled = timeline.active;
        timeline.active = null;
        return cancelled;
    }
}

export default GenerationTimelineSystem;
