// domain/media/mediaSystem.js

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';
import { ConsequenceSystem } from '../decision/consequenceSystem.js';

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

export class MediaSystem {
    initMediaData() {
        return { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null, proCoverageUnlocked: false };
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
        media.followers += 80 + goalsScored * 420 + assists * 250;
        media.hypeLevel = Math.min(100, media.hypeLevel + Math.max(1, goalsScored * 5 + assists * 2));
        let content, source, type;
        if (goalsScored >= 2) {
            content = `${player.firstname || 'Le jeune joueur'} frappe fort avec ${goalsScored} buts. Cette fois, sa performance oblige les observateurs à regarder de plus près.`;
            source = 'Actu Foot'; type = 'media';
        } else if (goalsScored === 1 || assists > 0) {
            content = `${player.firstname || 'Le joueur'} laisse une trace directe sur le score${goalsScored ? ' avec un but' : ''}${goalsScored && assists ? ' et' : ''}${assists ? ` ${assists} passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}` : ''}.`;
            source = 'Le Journal du Match'; type = 'media';
        } else if (rating > 0 && rating < 5.5) {
            content = `Première période plus difficile pour ${player.firstname || 'le jeune joueur'} : une prestation en retrait qui devra être suivie d’une réaction sur le terrain.`;
            source = 'Chronique du club'; type = 'critique';
        } else {
            content = `${player.firstname || 'Le joueur'} poursuit ses premiers pas chez les pros. Pas d’emballement : les prochaines apparitions diront si une tendance se dessine.`;
            source = 'Suivi jeunes pros'; type = 'media';
        }
        const post = { id: Date.now(), source, type, content, likes: Math.floor(Math.random() * 300) + 20, commentsCount: Math.floor(Math.random() * 25) + 1, date: `Mois ${state.calendar.currentMonth}` };
        media.feed.unshift(post);
        if (media.feed.length > 10) media.feed.pop();
        media.recentDilemma = Math.random() < 0.28 ? this.getRandomMediaDilemma() : null;
        EventBus.emit(EVENTS.MEDIA_POST_CREATED, { state, playerId: player.id, post });
        if (media.recentDilemma) EventBus.emit(EVENTS.MEDIA_DILEMMA_CREATED, { state, playerId: player.id, dilemma: media.recentDilemma });
        return { post, dilemma: media.recentDilemma };
    }
    getRandomMediaDilemma() {
        const dilemmas = [
            { id: 'first_attention', title: '🎙️ Les premiers micros', description: 'Après plusieurs apparitions professionnelles, un journaliste te demande comment tu vis cette nouvelle exposition.', choices: [{ text: 'Parler du travail avant tout', effect: { hypeDelta: 2, followerDelta: 250, coachDelta: 5 } }, { text: 'Assumer tes ambitions', effect: { hypeDelta: 8, followerDelta: 800, coachDelta: -2 } }] },
            { id: 'locker_room_story', title: '📸 Une image du vestiaire circule', description: 'Une photo anodine prise après le match commence à circuler. On te demande si tu veux commenter.', choices: [{ text: 'Répondre avec humour', effect: { moraleDelta: 3, followerDelta: 400, relationshipDelta: 3 } }, { text: 'Laisser passer', effect: { coachDelta: 3, followerDelta: 80 } }] },
            { id: 'pression_media', title: '🎙️ Une question qui pique', description: 'Un journaliste revient précisément sur ton temps de jeu et te demande si tu t’attendais à davantage.', choices: [{ text: 'Répondre franchement sans attaquer le staff', effect: { hypeDelta: 6, moraleDelta: 3, coachDelta: -3 } }, { text: 'Rester collectif', effect: { coachDelta: 8, hypeDelta: -1 } }] }
        ];
        return dilemmas[Math.floor(Math.random() * dilemmas.length)];
    }
    resolveDilemma(state, choiceIndex) {
        if (!state.media?.recentDilemma) return null;
        const dilemma = state.media.recentDilemma, choice = dilemma.choices?.[choiceIndex];
        if (!choice) return null;
        const eff = choice.effect || {};
        const impacts = { 'media.hypeLevel': Number(eff.hypeDelta) || 0, 'media.followers': Number(eff.followerDelta) || 0, morale: Number(eff.moraleDelta) || 0, relationCoach: Number(eff.coachDelta) || 0, vestiaire: Number(eff.relationshipDelta) || 0 };
        const result = ConsequenceSystem.applyMediaChoice(state, { id: dilemma.id, consequences: { permanent: impacts } });
        state.media.recentDilemma = null;
        EventBus.emit(EVENTS.MEDIA_DILEMMA_RESOLVED, { state, playerId: state.player?.id, dilemmaId: dilemma.id, choiceIndex, effects: { hidden: true } });
        return { ...result, message: `Choix : ${choice.text || choice.texte || 'Décision'}`, dilemmaId: dilemma.id, choiceIndex };
    }
}
export default MediaSystem;
