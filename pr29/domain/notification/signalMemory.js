// domain/notification/signalMemory.js
// Mémoire narrative longue durée des signaux de carrière.

export class SignalMemory {
    constructor({ state = null } = {}) {
        this.state = state;
    }

    setState(state) {
        this.state = state;
    }

    remember(signal, state = this.state) {
        if (!state || !signal) return null;
        state.careerMemory ||= [];
        const memory = {
            id: `memory_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            signalId: signal.id,
            threadId: signal.threadId || null,
            category: signal.category,
            title: signal.title,
            createdAt: signal.createdAt,
            rememberedAt: new Date().toISOString(),
            importance: signal.priorityScore || 0,
            source: signal.source || null,
            clubId: signal.clubId || null,
            actorId: signal.actorId || null
        };
        state.careerMemory.push(memory);
        return memory;
    }

    find(state = this.state, { category = null, clubId = null, threadId = null } = {}) {
        return (state?.careerMemory || [])
            .filter(memory => !category || memory.category === category)
            .filter(memory => !clubId || memory.clubId === clubId)
            .filter(memory => !threadId || memory.threadId === threadId)
            .sort((a, b) => new Date(b.rememberedAt) - new Date(a.rememberedAt));
    }
}

export default SignalMemory;
