// events.js
import { StateManager } from './state.js';
import { ConsequenceSystem } from './consequenceSystem.js';

export const listeEvenements = [
  {
    id: "soiree_veille_match",
    poids: 5,
    titre: "🎉 La Soirée de Trop",
    description: "Des amis t'invitent à une fête improvisée la veille d'une séance d'entraînement cruciale.",
    categorie: "hygiene_de_vie",
    conditions: { age_min: 16 },
    choix: [
      {
        id: "refuser",
        texte: "Rester chez soi et se reposer",
        impacts: { fitness: 3, morale: 0, discipline: 2 }
      },
      {
        id: "sortir",
        texte: "Y aller pour souffler un peu",
        impacts: { fitness: -8, morale: 5, discipline: -3 }
      },
      {
        id: "coup_de_vent",
        texte: "Passer juste une heure sans boire d'alcool",
        impacts: { fitness: 0, morale: 2, discipline: 0 }
      },
      {
        id: "inviter_chez_soi",
        texte: "Les inviter chez toi pour contrôler l'heure du coucher",
        impacts: { balance: -50, fitness: -2, morale: 4, discipline: -1 }
      }
    ]
  },
  {
    id: "propo_agent",
    poids: 3,
    titre: "🤝 L'Appel d'un Nouvel Agent",
    description: "Un agent de joueurs réputé te contacte pour s'occuper de la gestion de ta carrière.",
    categorie: "carriere",
    conditions: { age_min: 18 },
    choix: [
      {
        id: "accepter_agent",
        texte: "Signer avec lui",
        impacts: { balance: -200, fame: 5 }
      },
      {
        id: "refuser_agent",
        texte: "Continuer en solo pour l'instant",
        impacts: { balance: 0, fame: 0 }
      },
      {
        id: "negocier_contrat",
        texte: "Négocier fermement ses commissions à la baisse",
        impacts: { balance: -50, fame: 3, morale: -1 }
      },
      {
        id: "avis_famille",
        texte: "Demander conseil à ta famille avant de décider",
        impacts: { morale: 2, fame: 1 }
      }
    ]
  },
  {
    id: "fatigue_entrainement",
    poids: 6,
    titre: "⚡ Coup de Pompe à l'Entraînement",
    description: "La charge de travail de la semaine pèse lourd sur tes jambes et ton organisme.",
    categorie: "sante",
    conditions: { age_min: 16 },
    choix: [
      {
        id: "donner_fond",
        texte: "Serrer les dents et tout donner",
        impacts: { fitness: -5, 'attributes.physique': 1 }
      },
      {
        id: "lever_pied",
        texte: "Lever le pied pour éviter la blessure",
        impacts: { fitness: 4, morale: -1 }
      },
      {
        id: "entrainement_allege",
        texte: "Demander un programme allégé au coach",
        impacts: { fitness: 2, discipline: -1, morale: 1 }
      },
      {
        id: "cryotherapie",
        texte: "Payer une séance de cryothérapie en clinique privée",
        impacts: { balance: -100, fitness: 8, morale: 2 }
      }
    ]
  },
  {
    id: "reseaux_sociaux_bad_buzz",
    poids: 2,
    titre: "📱 Bad Buzz sur les Réseaux",
    description: "Une de tes publications ou réactions sur les réseaux sociaux fait polémique auprès des supporters.",
    categorie: "media",
    conditions: { age_min: 16 },
    choix: [
      {
        id: "communique_excuses",
        texte: "Publier un communiqué d'excuses formel",
        impacts: { morale: -2, fame: 2 }
      },
      {
        id: "ignorer_polemique",
        texte: "Ignorer et laisser couler",
        impacts: { morale: 1, fame: -3 }
      },
      {
        id: "video_humour",
        texte: "Désamorcer avec une vidéo explicative humoristique",
        impacts: { morale: 2, fame: 4, discipline: -1 }
      },
      {
        id: "agence_com",
        texte: "Engager une agence de relation presse pour éteindre l'incendie",
        impacts: { balance: -300, fame: 5, morale: 1 }
      }
    ]
  },
  {
    id: "prime_match",
    poids: 4,
    titre: "💰 Prime de Match Exceptionnelle",
    description: "Suite à ta grosse performance et ton influence sur le terrain, la direction te verse une prime.",
    categorie: "economie",
    conditions: { age_min: 16 },
    choix: [
      {
        id: "epargner",
        texte: "Placer l'argent sagement",
        impacts: { balance: 1500, morale: 2 }
      },
      {
        id: "faire_plaisir",
        texte: "Investir dans du matériel ou se faire plaisir",
        impacts: { balance: 500, morale: 6, fitness: 2 }
      },
      {
        id: "regaler_equipe",
        texte: "Inviter toute l'équipe au restaurant",
        impacts: { balance: -200, morale: 8, discipline: 3 }
      },
      {
        id: "don_association",
        texte: "Faire un don à une association caritative locale",
        impacts: { balance: -500, fame: 8, morale: 5 }
      }
    ]
  },
  {
    id: "sollicitation_media",
    poids: 4,
    titre: "🎙️ Interview exclusive demandée",
    description: "Un média local souhaite réaliser un portrait sur ton parcours et tes ambitions.",
    categorie: "media",
    conditions: { age_min: 16 },
    choix: [
      {
        id: "accepter_interview",
        texte: "Accepter l'interview pour soigner ton image",
        impacts: { fame: 5, morale: 2, fitness: -2 }
      },
      {
        id: "refuser_interview",
        texte: "Refuser pour rester concentré sur le terrain",
        impacts: { fame: 0, morale: 0 }
      },
      {
        id: "interview_differee",
        texte: "Demander à repousser l'interview après le prochain match",
        impacts: { fame: 2, morale: 1, discipline: 1 }
      },
      {
        id: "interview_duo",
        texte: "Accepter mais imposer de la faire avec un coéquipier",
        impacts: { fame: 3, morale: 4, discipline: 2 }
      }
    ]
  },
  {
    id: "proche_besoin_aide",
    poids: 3,
    titre: "❤️ Un Proche dans le Besoin",
    description: "Un membre de ta famille te demande un coup de main financier pour un projet personnel.",
    categorie: "famille",
    conditions: { age_min: 18 },
    choix: [
      {
        id: "aider_financierement",
        texte: "L'aider généreusement",
        impacts: { balance: -1000, morale: 6 }
      },
      {
        id: "refuser_poliment",
        texte: "Expliquer ta situation et refuser",
        impacts: { balance: 0, morale: -4 }
      },
      {
        id: "aider_partiellement",
        texte: "Prêter une somme plus modeste",
        impacts: { balance: -300, morale: 2 }
      },
      {
        id: "aider_temps",
        texte: "L'aider avec ton temps et ton réseau plutôt qu'avec de l'argent",
        impacts: { fitness: -3, morale: 3, fame: 1 }
      }
    ]
  },
  {
    id: "blessure_legere",
    poids: 3,
    titre: "🏥 Gêne Musculaire",
    description: "Tu ressens une vive douleur à l'ischio-jambier à la fin de la séance du jour.",
    categorie: "sante",
    conditions: { age_min: 16 },
    choix: [
      {
        id: "prevenir_staff",
        texte: "Le dire tout de suite au staff médical",
        impacts: { fitness: 5, isInjured: true, injuryDuration: 1 }
      },
      {
        id: "cacher_douleur",
        texte: "Cacher la douleur pour ne pas rater le prochain match",
        impacts: { fitness: -15, isInjured: true, injuryDuration: 2 }
      },
      {
        id: "medecin_prive",
        texte: "Consulter un ostéopathe privé en urgence",
        impacts: { balance: -150, fitness: 8, isInjured: false, morale: 2 }
      },
      {
        id: "strap_bandage",
        texte: "Demander un gros strap au kiné sans parler de la gravité",
        impacts: { fitness: -5, discipline: -1, isInjured: true, injuryDuration: 1 }
      }
    ]
  },
  {
    id: "proposition_equipementier",
    poids: 2,
    titre: "📦 Contrat d'E-réputation / Équipementier",
    description: "Une marque de sportswear te propose de devenir ambassadeur pour leurs nouveaux crampons.",
    categorie: "carriere",
    conditions: { age_min: 17 },
    choix: [
      {
        id: "signer_contrat",
        texte: "Accepter le contrat de sponsoring classique",
        impacts: { balance: 800, fame: 5 }
      },
      {
        id: "refuser_contrat",
        texte: "Trouver l'offre trop basse et refuser",
        impacts: { balance: 0, morale: 0 }
      },
      {
        id: "surenchere",
        texte: "Faire jouer la concurrence pour faire monter le prix",
        impacts: { balance: 1200, fame: 2, morale: -2 }
      },
      {
        id: "dotation_club",
        texte: "Accepter, mais exiger des équipements pour ton club formateur",
        impacts: { balance: 300, fame: 10, morale: 6 }
      }
    ]
  },
  {
    id: "panne_vehicule",
    poids: 3,
    titre: "🚗 Panne de Voiture",
    description: "Ta voiture refuse de démarrer ce matin. Tu risques d'arriver en retard à l'entraînement.",
    categorie: "vie_quotidienne",
    conditions: { age_min: 18 },
    choix: [
      {
        id: "reparer_immediat",
        texte: "Faire remorquer au garage en urgence",
        impacts: { balance: -450, morale: -2 }
      },
      {
        id: "transports_commun",
        texte: "Prendre les transports en commun et arriver en retard",
        impacts: { balance: -20, morale: -5, discipline: -3 }
      },
      {
        id: "covoiturage_coequipier",
        texte: "Appeler un coéquipier pour qu'il passe te prendre",
        impacts: { morale: 3, discipline: 1 }
      },
      {
        id: "velo_course",
        texte: "Y aller en courant ou à vélo comme un vrai athlète",
        impacts: { fitness: -5, 'attributes.physique': 1, morale: 2 }
      }
    ]
  }
];

export const EventEngine = {
    checkAndTriggerEvent(state) {
        const playerAge = state.player.age || 16;
        const disponibles = listeEvenements.filter(ev => {
            if (ev.conditions.age_min && playerAge < ev.conditions.age_min) return false;
            return true;
        });

        if (disponibles.length === 0) return null;

        if (Math.random() < 0.40) {
            const totalPoids = disponibles.reduce((acc, ev) => acc + ev.poids, 0);
            let random = Math.random() * totalPoids;

            for (const ev of disponibles) {
                if (random < ev.poids) return ev;
                random -= ev.poids;
            }
            return disponibles[0];
        }

        return null;
    },

    resolveChoice(state, eventId, choiceIndex) {
        const event = listeEvenements.find(item => item.id === eventId);
        if (!state?.player || !event || !event.choix?.[choiceIndex]) return null;

        const choice = event.choix[choiceIndex];
        const result = ConsequenceSystem.applyEventChoice(state, choice);

        // Les blessures / drapeaux historiques restent compatibles.
        const impacts = choice.impacts || {};
        if (impacts.isInjured !== undefined) {
            state.player.isInjured = Boolean(impacts.isInjured);
        }
        if (impacts.injuryDuration !== undefined) {
            state.player.injuryDuration = Math.max(0, Number(impacts.injuryDuration) || 0);
            if (state.player.injuryDuration > 0) state.player.isInjured = true;
        }
        console.log(
            `🎯 Événement résolu [${event.titre}] -> Choix : "${choice.texte}"`,
            impacts
        );

        return {
            ...result,
            choiceText: choice.texte,
            eventId: event.id
        };
    }
};
