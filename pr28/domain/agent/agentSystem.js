// domain/agent/agentSystem.js
// L'agent est un acteur du monde : réseau, spécialités, loyauté et influence évoluent.

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class AgentSystem {
    evaluate({ state, agent = {}, player = {}, context = {} }) {
        const relationship = clamp(Number(context.relationship ?? agent.relationship ?? 50));
        const reputation = clamp(Number(agent.reputation ?? 50));
        const network = clamp(Number(agent.network ?? 50));
        const negotiation = clamp(Number(agent.negotiation ?? 50));
        const loyalty = clamp(Number(agent.loyalty ?? 50));
        const commission = clamp(Number(agent.commission ?? 50));
        const playerReputation = clamp(Number(player.reputation ?? 50));

        const access = Math.round(network * 0.35 + reputation * 0.25 + playerReputation * 0.20 + relationship * 0.20);
        const influence = Math.round(relationship * 0.35 + reputation * 0.20 + loyalty * 0.20 + negotiation * 0.15 + commission * 0.10);

        return {
            agentId: agent.id || null,
            access: clamp(access),
            influence: clamp(influence),
            negotiation,
            loyalty,
            relationship,
            profile: {
                network,
                reputation,
                commission
            },
            tension: this.#tension(agent, player, context)
        };
    }

    createOpportunity({ state, agent, player, club, reason = 'network' }) {
        const evaluation = this.evaluate({ state, agent, player, context: { relationship: agent.relationship } });
        if (evaluation.access < 55) return null;

        state.agentOpportunities ||= [];
        const opportunity = {
            id: `agent_opportunity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            agentId: agent.id || null,
            playerId: player.id || null,
            clubId: club?.id || null,
            reason,
            access: evaluation.access,
            createdAt: new Date().toISOString(),
            status: 'unconfirmed'
        };
        state.agentOpportunities.push(opportunity);
        return opportunity;
    }

    #tension(agent, player, context) {
        const financial = Number(agent.commission ?? 50) - Number(context.playerFinancialPreference ?? 50);
        const ambition = Number(agent.ambition ?? 50) - Number(context.playerSportingPreference ?? 50);
        const trust = Number(context.relationship ?? agent.relationship ?? 50);
        return Math.round(clamp(Math.abs(financial) * 0.35 + Math.abs(ambition) * 0.35 + (100 - trust) * 0.30));
    }
}

export default AgentSystem;
