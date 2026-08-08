// gameEngine.js
import { UserInterface } from './ui.js';
import { MatchBlockManager } from './matchBlock.js';
import { EconomyManager } from './economy.js';
import { SocialSystem } from './social.js'; // 1. Import du module social

export class GameEngine {
    constructor() {
        this.state = null;
        this.socialSystem = new SocialSystem(this); // 2. Initialisation du système social
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
            // 3. Ajout des données sociales initiales dans le state
            social: this.socialSystem.initSocialData(selectedData.coachName),
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

        // Le MatchBlockManager s'occupe déjà de tout simuler, 
        // de mettre à jour les stats globales et l'économie en interne.
        const report = MatchBlockManager.simulateBlock(this.state);

        // 4. Mise à jour du cycle social à chaque fin de mois (âge, impact romance/moral)
        this.socialSystem.updateSocialCycle(this.state);

        // Avancer d'un mois dans le calendrier
        const cal = this.state.calendar;
        if (cal.currentMonth < cal.totalMonths) {
            cal.currentMonth++;
            cal.currentPeriod = cal.getPeriodName(cal.currentMonth);
            // On peut aussi vieillir le joueur d'un mois ou gérer l'anniversaire si besoin
        } else {
            console.log("🏁 Fin de la saison !");
        }

        console.log(`Mois terminé. Passage au mois ${cal.currentMonth} (${cal.currentPeriod})`);

        return {
            report,
            calendar: {
                month: cal.currentMonth - 1,
                period: cal.currentPeriod
            }
        };
    }
}

// Lancement automatique du jeu au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
