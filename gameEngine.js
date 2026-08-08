// gameEngine.js
import { UserInterface } from './ui.js';
import { MatchBlockManager } from './matchBlock.js';
import { EconomyManager } from './economy.js';
import { SocialSystem } from './social.js';
import { MediaSystem } from './media.js';
import { EventEngine } from './events.js'; // 1. Import du module d'événements

export class GameEngine {
    constructor() {
        this.state = null;
        this.socialSystem = new SocialSystem(this);
        this.mediaSystem = new MediaSystem(this);
        this.ui = new UserInterface(this);
    }

    /**
     * Appelé par l'UI à la fin de l'étape 5 pour lancer la carrière
     */
    startCareer(selectedData) {
        const initialOvr = 60;
        const potentialOvr = initialOvr + Math.floor(Math.random() * 15) + 10;

        const tempPlayerForEconomy = {
            overall: initialOvr,
            age: 16
        };

        const contract = EconomyManager.calculateContractOffer(selectedData.youthClub, tempPlayerForEconomy);

        this.state = {
            player: {
                firstname: selectedData.firstname,
                lastname: selectedData.lastname,
                position: selectedData.position,
                age: 16,
                club: selectedData.youthClub.name,
                salary: contract.weeklySalary,
                overall: initialOvr,
                fame: 10,
                morale: 80,
                fitness: 90,
                isInjured: false,
                
                // Statistiques de la saison
                stats: {
                    matchesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    successfulPasses: 0,
                    tackles: 0,
                    averageRating: 0.0
                },
                potential: potentialOvr,

                // Attributs cachés
                attributes: {
                    consistency: Math.floor(Math.random() * 8) + 8,
                    bigMatchPlayer: Math.floor(Math.random() * 8) + 8,
                    injuryProneness: Math.floor(Math.random() * 10) + 6
                }
            },
            // Données sociales
            social: this.socialSystem.initSocialData(selectedData.coachName),
            // Données média et réseaux sociaux initiales
            media: this.mediaSystem.initMediaData(),
            career: {
                balance: contract.signingBonus || 1500
            },
            calendar: {
                currentMonth: 1,
                totalMonths: 12,
                currentPeriod: "Avant-saison & Début",
                getPeriodName(month) {
                    if (month <= 3) return "Avant-saison & Début";
                    if (month <= 6) return "Première partie de saison";
                    if (month === 7) return "Mercato hivernal & Trêve";
                    if (month <= 10) return "Seconde partie de saison";
                    return "Sprint final & Bilan";
                }
            },
            seasonPhase: 'pre_season'
        };

        console.log("Carrière lancée avec succès !", this.state);
    }

    /**
     * Permet de simuler un bloc de 4 matchs (1 mois) via le MatchBlockManager
     */
    playBlock() {
        if (!this.state) return;

        if (this.state.player.isInjured) {
            alert("Impossible de jouer, votre joueur est blessé !");
            return;
        }

        // Le MatchBlockManager s'occupe de simuler et de mettre à jour les stats globales/économie
        const report = MatchBlockManager.simulateBlock(this.state);

        // Mise à jour du cycle social à chaque fin de mois
        this.socialSystem.updateSocialCycle(this.state);

        // Génération des posts, de la hype et des dilemmes médias basés sur le rapport du bloc
        this.mediaSystem.generatePostAfterBlock(this.state, report);

        // 2. Vérification et tirage au sort d'un événement aléatoire pondéré pour ce bloc
        const triggeredEvent = EventEngine.checkAndTriggerEvent(this.state);
        if (triggeredEvent) {
            console.log("⚡ Événement déclenché :", triggeredEvent.titre);
            this.state.pendingEvent = triggeredEvent; // Stocke l'événement dans le state si besoin
        }

        // Avancer d'un mois dans le calendrier
        const cal = this.state.calendar;
        if (cal.currentMonth < cal.totalMonths) {
            cal.currentMonth++;
            cal.currentPeriod = cal.getPeriodName(cal.currentMonth);
        } else {
            console.log("🏁 Fin de la saison !");
        }

        console.log(`Mois terminé. Passage au mois ${cal.currentMonth} (${cal.currentPeriod})`);

        return {
            report,
            calendar: {
                month: cal.currentMonth - 1,
                period: cal.currentPeriod
            },
            event: triggeredEvent || null
        };
    }

    /**
     * Permet de résoudre un dilemme média depuis l'interface
     */
    resolveMediaDilemma(choiceIndex) {
        if (!this.state) return;
        this.mediaSystem.resolveDilemma(this.state, choiceIndex);
    }
}

// Lancement automatique du jeu au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
