// domain/media/mediaSystem.js

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';
import { ConsequenceSystem } from '../decision/consequenceSystem.js';
import { MEDIA_DILEMMAS, mediaPostText, stableCareerPick } from '../narrative/careerLifeNarrativeLibrary.js';

function hasProfessionalAppearance(state = {}, matchReport = {}) {
    const player = state.player || {};
    const stats = player.stats || {};
    const explicit = Number(stats.professionalMatches ?? stats.proMatches);
    if (Number.isFinite(explicit)) return explicit > 0;
    const matches = Number(stats.matchesPlayed || 0);
    const reportMatches = Number(matchReport?.matchesPlayed || 0);
    const squad = String(player.squadStatus || '').toLowerCase();
    const stage = String(player.careerStage || player.stage || '').toLowerCase();
    const stillYouth = squad.includes('formation') || squad.includes('academy') || squad.includes('jeune') || stage.includes('youth') || stage.includes('formation');
    return !stillYouth && (matches > 0 || reportMatches > 0);
}

function sourceFor({ goals = 0, assists = 0, rating = 0, hype = 0 } = {}) {
    if (goals >= 2 || hype >= 55) return 'Actu Foot';
    if (goals || assists) return 'Le Journal du Match';
    if (rating > 0 && rating < 5.5) return 'Chronique du club';
    return 'Suivi jeunes pros';
}

export class MediaSystem {
    initMediaData() {
        return { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null, proCoverageUnlocked: false, recentPostKeys: [] };
    }

    generatePostAfterBlock(state, matchReport) {
        if (!state.media) state.media = this.initMediaData();
        const media = state.media, player = state.player;
        if (!hasProfessionalAppearance(state, matchReport)) {
            media.proCoverageUnlocked = false;
            media.recentDilemma = null;
            return { post: null, dilemma: null, suppressedReason: 'before_first_pro_match' };
        }

        media.proCoverageUnlocked = true;
        const goalsScored = Number(matchReport?.goals || 0), assists = Number(matchReport?.assists || 0);
        const rating = Number(matchReport?.averageRating ?? matchReport?.rating ?? 0);
        const seed = state?.narrativeState?.seed || state?.career?.seed || player?.id || 'career';
        const matchKey = `${state.calendar?.currentSeason || 0}:${state.calendar?.currentMonth || 0}:${goalsScored}:${assists}:${rating.toFixed(1)}`;
        const name = [player.firstname, player.lastname].filter(Boolean).join(' ') || player.firstname || 'Le joueur';
        const content = mediaPostText({ seed, key: matchKey, name, goals: goalsScored, assists, rating });
        const source = sourceFor({ goals: goalsScored, assists, rating, hype: media.hypeLevel });
        const type = rating > 0 && rating < 5.5 ? 'critique' : 'media';

        media.followers += 80 + goalsScored * 420 + assists * 250;
        media.hypeLevel = Math.min(100, media.hypeLevel + Math.max(1, goalsScored * 5 + assists * 2));
        const post = {
            id: Date.now(), source, type, content,
            likes: Math.floor(Math.random() * Math.max(120, media.followers * 0.18)) + 20,
            commentsCount: Math.floor(Math.random() * Math.max(8, media.followers * 0.012)) + 1,
            date: `Mois ${state.calendar.currentMonth}`
        };
        media.feed.unshift(post);
        if (media.feed.length > 10) media.feed.pop();
        media.recentPostKeys ||= [];
        media.recentPostKeys.push(matchKey);
        if (media.recentPostKeys.length > 5) media.recentPostKeys.shift();

        media.recentDilemma = Math.random() < 0.28 ? this.getRandomMediaDilemma(state) : null;
        EventBus.emit(EVENTS.MEDIA_POST_CREATED, { state, playerId: player.id, post });
        if (media.recentDilemma) EventBus.emit(EVENTS.MEDIA_DILEMMA_CREATED, { state, playerId: player.id, dilemma: media.recentDilemma });
        return { post, dilemma: media.recentDilemma };
    }

    getRandomMediaDilemma(state = {}) {
        const seed = state?.narrativeState?.seed || state?.player?.id || 'career';
        const recent = new Set((state?.careerMemory || []).filter(item => item?.source === 'Media').slice(-3).map(item => item?.eventId));
        const available = MEDIA_DILEMMAS.filter(item => !recent.has(item.id));
        const pool = available.length ? available : MEDIA_DILEMMAS;
        const key = `${state?.calendar?.currentSeason || 0}:${state?.calendar?.currentMonth || 0}:media-dilemma`;
        return stableCareerPick(seed, key, pool);
    }

    resolveDilemma(state, choiceIndex) {
        if (!state.media?.recentDilemma) return null;
        const dilemma = state.media.recentDilemma, choice = dilemma.choices?.[choiceIndex];
        if (!choice) return null;
        const eff = choice.effect || {};
        const impacts = {
            'media.hypeLevel': Number(eff.hypeDelta) || 0,
            'media.followers': Number(eff.followerDelta) || 0,
            morale: Number(eff.moraleDelta) || 0,
            relationCoach: Number(eff.coachDelta) || 0,
            vestiaire: Number(eff.relationshipDelta) || 0
        };
        const result = ConsequenceSystem.applyMediaChoice(state, { id: dilemma.id, consequences: { permanent: impacts } });
        state.careerMemory ||= [];
        state.careerMemory.push({
            id: `media-choice-${Date.now()}`,
            type: 'media-choice', source: 'Media', eventId: dilemma.id,
            eventTitle: dilemma.title, choiceText: choice.text,
            responseText: choice.response || null,
            createdAt: new Date().toISOString()
        });
        state.media.recentDilemma = null;
        EventBus.emit(EVENTS.MEDIA_DILEMMA_RESOLVED, { state, playerId: state.player?.id, dilemmaId: dilemma.id, choiceIndex, effects: { hidden: true } });
        return { ...result, responseText: choice.response || result.responseText, message: choice.response || `Choix : ${choice.text || choice.texte || 'Décision'}`, dilemmaId: dilemma.id, choiceIndex };
    }
}
export default MediaSystem;
