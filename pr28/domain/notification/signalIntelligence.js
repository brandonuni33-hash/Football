// domain/notification/signalIntelligence.js
// Décide comment un signal doit être vécu par le joueur.
// Ne rend rien et ne dépend jamais de l'UI.

const LEVELS = Object.freeze({ feed: 20, toast: 40, important: 65, decision: 85, scene: 100 });

export class SignalIntelligence {
    evaluate(signal = {}, context = {}) {
        const score = this.score(signal, context);
        const delivery = this.delivery(score, signal, context);
        const certainty = this.certainty(signal);
        const visibility = this.visibility(signal, context);

        return Object.freeze({
            score,
            level: delivery.level,
            interrupt: delivery.interrupt,
            channel: delivery.channel,
            certainty,
            visibility,
            expires: delivery.expires
        });
    }

    score(signal = {}, context = {}) {
        let score = Number(signal.priorityScore || LEVELS.feed);
        score += Math.round((Number(signal.confidence ?? 1) - 0.5) * 20);
        score += Number(signal.actionable ? 15 : 0);
        score += Number(context.personal ? 10 : 0);
        score += Number(context.consequence ? 15 : 0);
        score += Number(context.urgent ? 20 : 0);
        score -= Number(context.inMatch ? 15 : 0);
        score -= Number(context.cooldown ? 20 : 0);
        return Math.max(0, Math.min(100, score));
    }

    delivery(score, signal = {}, context = {}) {
        if (signal.priority === 'scene' || score >= 90) {
            return { level: 'scene', interrupt: true, channel: 'intervention', expires: null };
        }
        if (signal.priority === 'decision' || score >= 75) {
            return { level: 'decision', interrupt: true, channel: 'decision', expires: null };
        }
        if (score >= 55) {
            return { level: 'important', interrupt: false, channel: 'banner', expires: null };
        }
        if (score >= 30) {
            return { level: 'toast', interrupt: false, channel: 'toast', expires: context.now ? context.now + 7000 : null };
        }
        return { level: 'feed', interrupt: false, channel: 'feed', expires: null };
    }

    certainty(signal = {}) {
        const confidence = Number(signal.confidence ?? 1);
        if (confidence >= 0.85) return 'certain';
        if (confidence >= 0.6) return 'probable';
        if (confidence >= 0.35) return 'rumor';
        return 'uncertain';
    }

    visibility(signal = {}, context = {}) {
        if (signal.visibility === 'hidden') return 'hidden';
        if (signal.visibility === 'confirmed') return 'confirmed';
        if (signal.visibility === 'indirect') return context.hasWitness ? 'indirect' : 'hidden';
        return 'visible';
    }
}

export default SignalIntelligence;
