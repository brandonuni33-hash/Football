// domain/media/mediaSystem.js

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';
import { ConsequenceSystem } from '../decision/consequenceSystem.js';

export class MediaSystem {
    initMediaData() {
        return {
            followers: 1200,
            hypeLevel: 10,
            feed: [{ id: 1, source: 'Le Petit Journal Local', type: 'news', content: 'Un nouveau jeune talent débarque au centre de formation. Les observateurs curieux de voir son évolution.', likes: 42, commentsCount: 3, date: 'Début de saison' }],
            recentDilemma: null
        };
    }
    generatePostAfterBlock(state, matchReport) {
        if (!state.media) state.media = this.initMediaData();
        const media = state.media, player = state.player;
        const goalsScored = matchReport?.goals || 0, assists = matchReport?.assists || 0;
        media.followers += 150 + goalsScored * 500 + assists * 300;
        media.hypeLevel = Math.min(100, media.hypeLevel + goalsScored * 5 + 2);
        let newPostContent = '', sourceName = 'Supporters du club', postType = 'fans';
        if (goalsScored >= 2) { newPostContent = `Quel match de ${player.firstname} ${player.lastname} ! Le gamin est en feu en ce moment, futur crack 🔥⚽`; sourceName = 'Actu Foot Jeunes'; postType = 'media'; }
        else if (matchReport && (matchReport.averageRating ?? matchReport.rating) < 5.5) { newPostContent = `Match compliqué pour ${player.firstname}. Il va falloir se ressaisir rapidement sur le terrain... 📉`; sourceName = 'Forum Officiel'; postType = 'critique'; }
        else { newPostContent = `Semaine studieuse à l'entraînement pour ${player.firstname} ${player.lastname}. Concentré sur les objectifs du club. 🧠💪`; sourceName = 'Mon compte officiel (@' + player.lastname.toLowerCase() + ')'; postType = 'player'; }
        media.feed.unshift({ id: Date.now(), source: sourceName, type: postType, content: newPostContent, likes: Math.floor(Math.random() * 800) + 50, commentsCount: Math.floor(Math.random() * 45) + 2, date: `Mois ${state.calendar.currentMonth}` });
        if (media.feed.length > 10) media.feed.pop();
        media.recentDilemma = Math.random() < 0.4 ? this.getRandomMediaDilemma() : null;
        EventBus.emit(EVENTS.MEDIA_POST_CREATED, { state, playerId: player.id, post: media.feed[0] });
        if (media.recentDilemma) EventBus.emit(EVENTS.MEDIA_DILEMMA_CREATED, { state, playerId: player.id, dilemma: media.recentDilemma });
        return { post: media.feed[0], dilemma: media.recentDilemma };
    }
    getRandomMediaDilemma() {
        const dilemmas = [
            { id: 'tiktok_trend', title: '📱 Tendance Réseaux Sociaux', description: 'Une trend TikTok populaire tourne en dérision les jeunes joueurs qui se la racontent trop. Un journaliste te tague pour savoir si tu vas y participer.', choices: [{ text: 'Faire une vidéo décalée', effect: { hypeDelta: 10, followerDelta: 2500, coachDelta: -10 } }, { text: 'Ignorer poliment', effect: { hypeDelta: -2, followerDelta: 200, coachDelta: 5 } }] },
            { id: 'locker_room_story', title: '📸 Story fuité du vestiaire', description: 'Un coéquipier a posté une story par inadvertance où l’on te voit faire une sieste dans le vestiaire avant un décrassage. Les fans rigolent, mais la presse relaie l’info.', choices: [{ text: 'En rire dans les commentaires', effect: { moraleDelta: 5, followerDelta: 800, relationshipDelta: 5 } }, { text: 'Demander à supprimer', effect: { moraleDelta: -3, coachDelta: 5, relationshipDelta: -10 } }] },
            { id: 'pression_media', title: '🎙️ Interview tendue d’après-match', description: 'Un journaliste sportif te pose une question provocante sur ton manque de temps de jeu ou tes statistiques actuelles.', choices: [{ text: 'Répondre cash', effect: { coachDelta: -25, hypeDelta: 15, moraleDelta: 5 } }, { text: 'Langue de bois classique', effect: { coachDelta: 10, hypeDelta: -5, moraleDelta: 0 } }] }
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
