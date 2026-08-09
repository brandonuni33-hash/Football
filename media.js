// media.js

export class MediaSystem {
    constructor(engine) {
        this.engine = engine;
    }

    // Initialisation des données média et réseaux sociaux au lancement de la carrière
    initMediaData() {
        return {
            followers: 1200, // Nombre d'abonnés de départ (démarre doucement en jeunes)
            hypeLevel: 10,   // Niveau de popularité (de 0 à 100)
            feed: [
                {
                    id: 1,
                    source: "Le Petit Journal Local",
                    type: "news",
                    content: "Un nouveau jeune talent débarque au centre de formation. Les observateurs curieux de voir son évolution.",
                    likes: 42,
                    commentsCount: 3,
                    date: "Début de saison"
                }
            ],
            recentDilemma: null // Stocke un événement média/réseaux en attente de choix
        };
    }

    // Génération d'un post ou d'un événement média à la fin d'un bloc de match
    generatePostAfterBlock(state, matchReport) {
        if (!state.media) state.media = this.initMediaData();

        const media = state.media;
        const player = state.player;

        // Augmentation de la hype et des abonnés selon les performances du bloc
        const goalsScored = matchReport?.goals || 0;
        const assists = matchReport?.assists || 0;
        
        let followerGain = 150 + (goalsScored * 500) + (assists * 300);
        media.followers += followerGain;
        media.hypeLevel = Math.min(100, media.hypeLevel + (goalsScored * 5) + 2);

        // Création d'un post automatique basé sur les perfs
        let newPostContent = "";
        let sourceName = "Supporters du club";
        let postType = "fans";

        if (goalsScored >= 2) {
            newPostContent = `Quel match de ${player.firstname} ${player.lastname} ! Le gamin est en feu en ce moment, futur crack 🔥⚽`;
            sourceName = "Actu Foot Jeunes";
            postType = "media";
        } else if (matchReport && (matchReport.averageRating ?? matchReport.rating) < 5.5) {
            newPostContent = `Match compliqué pour ${player.firstname}. Il va falloir se ressaisir rapidement sur le terrain... 📉`;
            sourceName = "Forum Officiel";
            postType = "critique";
        } else {
            newPostContent = `Semaine studieuse à l'entraînement pour ${player.firstname} ${player.lastname}. Concentré sur les objectifs du club. 🧠💪`;
            sourceName = "Mon compte officiel (@" + player.lastname.toLowerCase() + ")";
            postType = "player";
        }

        // Ajouter au fil d'actualité en haut
        media.feed.unshift({
            id: Date.now(),
            source: sourceName,
            type: postType,
            content: newPostContent,
            likes: Math.floor(Math.random() * 800) + 50,
            commentsCount: Math.floor(Math.random() * 45) + 2,
            date: `Mois ${state.calendar.currentMonth}`
        });

        // Limiter le feed à 10 publications pour ne pas surcharger
        if (media.feed.length > 10) {
            media.feed.pop();
        }

        // Générer parfois un dilemme interactif (story/réseau/presse)
        if (Math.random() < 0.4) {
            media.recentDilemma = this.getRandomMediaDilemma(state);
        } else {
            media.recentDilemma = null;
        }
    }

    // Proposition de dilemmes innovants (Réseaux / Stories / Buzz)
    getRandomMediaDilemma(state) {
        const dilemmas = [
            {
                id: 'tiktok_trend',
                title: '📱 Tendance Réseaux Sociaux',
                description: 'Une trend TikTok populaire tourne en dérision les jeunes joueurs qui se la racontent trop. Un journaliste te tague pour savoir si tu vas y participer.',
                choices: [
                    { 
                        text: 'Faire une vidéo décalée (Booste la Hype et les abonnés, risque de agacer le coach)', 
                        effect: { hypeDelta: +10, followerDelta: +2500, coachDelta: -10 } 
                    },
                    { 
                        text: 'Ignorer poliment (Préserve ton image sérieuse auprès du staff)', 
                        effect: { hypeDelta: -2, followerDelta: +200, coachDelta: +5 } 
                    }
                ]
            },
            {
                id: 'locker_room_story',
                title: '📸 Story fuité du vestiaire',
                description: 'Un coéquipier a posté une story par inadvertance où l’on te voit faire une sieste dans le vestiaire avant un décrassage. Les fans rigolent, mais la presse relaie l’info.',
                choices: [
                    { 
                        text: 'En rire dans les commentaires (Montre un bon esprit d’équipe)', 
                        effect: { moraleDelta: +5, followerDelta: +800, relationshipDelta: +5 } 
                    },
                    { 
                        text: 'Demander à supprimer (Faire interdire le téléphone dans le vestiaire)', 
                        effect: { moraleDelta: -3, coachDelta: +5, relationshipDelta: -10 } 
                    }
                ]
            },
            {
                id: 'pression_media',
                title: '🎙️ Interview tendue d’après-match',
                description: 'Un journaliste sportif te pose une question provocante sur ton manque de temps de jeu ou tes statistiques actuelles.',
                choices: [
                    { 
                        text: 'Répondre cash : "Je mérite de jouer plus, le coach fait des erreurs"', 
                        effect: { coachDelta: -25, hypeDelta: +15, moraleDelta: +5 } 
                    },
                    { 
                        text: 'Langue de bois classique : "Je travaille dur pour l’équipe, le choix revient au mister"', 
                        effect: { coachDelta: +10, hypeDelta: -5, moraleDelta: 0 } 
                    }
                ]
            }
        ];

        const randomIndex = Math.floor(Math.random() * dilemmas.length);
        return dilemmas[randomIndex];
    }

    // Résoudre le choix du joueur face au dilemme média
    resolveDilemma(state, choiceIndex) {
        if (!state.media || !state.media.recentDilemma) return;

        const dilemma = state.media.recentDilemma;
        const choice = dilemma.choices[choiceIndex];
        const eff = choice.effect;

        // Application des effets sur le state
        if (eff.hypeDelta) state.media.hypeLevel = Math.max(0, Math.min(100, state.media.hypeLevel + eff.hypeDelta));
        if (eff.followerDelta) state.media.followers += eff.followerDelta;
        if (eff.moraleDelta) state.player.morale = Math.max(0, Math.min(100, state.player.morale + eff.moraleDelta));

        // Impact coach / relation si présent
        if (eff.coachDelta && state.social && state.social.relationships) {
            const coachRel = state.social.relationships.find(r => r.id === 'coach');
            if (coachRel) {
                coachRel.score = Math.max(-100, Math.min(100, coachRel.score + eff.coachDelta));
            }
        }

        // Effacer le dilemme après choix
        state.media.recentDilemma = null;
    }
}
