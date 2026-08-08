// events.js
import { StateManager } from './state.js';

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
        impacts: { fitness: 3, moral: 0, entente_coequipiers: 1 }
      },
      {
        id: "sortir",
        texte: "Y aller pour souffler un peu",
        impacts: { fitness: -8, moral: 5, entente_coequipiers: 4 }
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
        impacts: { argent: -200, influence: 10, opportunites_transfert: 5 }
      },
      {
        id: "refuser_agent",
        texte: "Continuer en solo pour l'instant",
        impacts: { argent: 0, influence: 0 }
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
        impacts: { fitness: -5, progression_note: 3 }
      },
      {
        id: "lever_pied",
        texte: "Lever le pied pour éviter la blessure",
        impacts: { fitness: 4, progression_note: -1 }
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
        texte: "Publier un communiqué d'excuses",
        impacts: { moral: -2, popularite_fans: 2 }
      },
      {
        id: "ignorer_polemique",
        texte: "Ignorer et laisser couler",
        impacts: { moral: 1, popularite_fans: -5 }
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
        impacts: { argent: 1500, moral: 2 }
      },
      {
        id: "faire_plaisir",
        texte: "Investir dans du matériel / Se faire plaisir",
        impacts: { argent: 500, moral: 6, fitness: 2 }
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
        impacts: { popularite_fans: 8, moral: 2, fatigue: 2 }
      },
      {
        id: "refuser_interview",
        texte: "Refuser pour rester concentré sur le terrain",
        impacts: { popularite_fans: 0, moral: 0 }
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
        impacts: { argent: -1000, moral: 6, relation_proches: 10 }
      },
      {
        id: "refuser_poliment",
        texte: "Expliquer ta situation et refuser",
        impacts: { argent: 0, moral: -4, relation_proches: -5 }
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
        impacts: { fitness: 5, indisponibilite_jours: 3 }
      },
      {
        id: "cacher_douleur",
        texte: "Cacher la douleur pour ne pas rater le prochain match",
        impacts: { fitness: -15, risque_grosse_blessure: true }
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
        texte: "Accepter le contrat de sponsoring",
        impacts: { argent: 800, popularite_fans: 5 }
      },
      {
        id: "refuser_contrat",
        texte: "Trouver l'offre trop basse et refuser",
        impacts: { argent: 0, moral: 0 }
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
        texte: "Passer par le garage en urgence",
        impacts: { argent: -450, moral: -2 }
      },
      {
        id: "transports_commun",
        texte: "Prendre les transports et arriver en retard",
        impacts: { argent: -20, moral: -5, relation_entraineur: -3 }
      }
    ]
  }
];

export const EventEngine = {
    checkTriggers: () => {
        const state = StateManager.get();
        
        // 1. Filtrer les événements selon les conditions du joueur
        const disponibles = listeEvenements.filter(ev => {
            if (ev.conditions.age_min && state.age < ev.conditions.age_min) return false;
            return true;
        });

        if (disponibles.length === 0) return null;

        // 2. Sélection pondérée
        const totalPoids = disponibles.reduce((acc, ev) => acc + ev.poids, 0);
        let random = Math.random() * totalPoids;

        for (const ev of disponibles) {
            if (random < ev.poids) return ev;
            random -= ev.poids;
        }

        return disponibles[0];
    }
};
