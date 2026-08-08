// gameEngine.js
import { UserInterface } from './ui.js';
import { MatchBlockManager } from './matchBlock.js';
import { EconomyManager } from './economy.js';

export class GameEngine {
    constructor() {
        this.state = null;
        // Lance l'interface utilisateur au démarrage
        this.ui = new UserInterface(this);
    }

    /**
     * Appelé par l'UI à la fin de l'étape 5 pour lancer la carrière
     */
    startCareer(selectedData) {
        const initialOvr = 60;
        const potentialOvr = initialOvr + Math.floor(Math.random() * 15) + 10;

        // Création d'un objet joueur temporaire pour calculer l'offre financière
        const tempPlayerForEconomy = {
            overall: initialOvr,
            age: 16
        };

        // Calcul du contrat via EconomyManager (salaire 100-300€ et bonus)
        const contract = EconomyManager.calculateContractOffer(selectedData.youthClub, tempPlayerForEconomy);

        this.state = {
            player: {
                firstname: selectedData.firstname,
                lastname: selectedData.lastname,
                position: selectedData.position,
                age: 16,
                club: selectedData.youthClub.name,
                salary: contract.weeklySalary, // Salaire aligné sur economy.js
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
            career: {
                balance: contract.signingBonus || 1500 // Prime à la signature dynamique
            },
            // Calendrier simplifié : 1 bloc = 1 mois
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

        console.log("Carrière lancée avec succès, calendrier et stats initialisés !", this.state);
    }

    /**
     * Permet de simuler un bloc de 4 matchs (1 mois), de mettre à jour les stats et d'avancer le calendrier
     */
    playBlock() {
        if (!this.state) return;

        if (this.state.player.isInjured) {
            alert("Impossible de jouer, votre joueur est blessé !");
            return;
        }

        // 1. Simulation du bloc de 4 matchs via matchBlock.js
        const report = MatchBlockManager.simulateBlock(this.state);
        
        // 2. Gestion financière du mois via EconomyManager (Salaire + Primes + Sponsors éventuels)
        const financialReport = EconomyManager.processBlockFinances(this.state, report.summary);

        // 3. Génération de stats annexes pour le bloc (passes et tacles)
        const blockPasses = Math.floor(Math.random() * 40) + 20;
        const blockTackles = Math.floor(Math.random() * 12) + 3;

        // 4. Mise à jour des statistiques globales de la saison
        const stats = this.state.player.stats;
        const prevMatches = stats.matchesPlayed;
        const newTotalMatches = prevMatches + 4;

        stats.matchesPlayed = newTotalMatches;
        stats.goals += report.summary.goals;
        stats.assists += report.summary.assists;
        stats.successfulPasses += blockPasses;
        stats.tackles += blockTackles;

        // Recalcul de la note moyenne globale pondérée
        stats.averageRating = parseFloat(
            (((stats.averageRating * prevMatches) + (report.summary.rating * 4)) / newTotalMatches).toFixed(1)
        );

        // 5. Avancer d'un mois dans le calendrier
        const cal = this.state.calendar;
        if (cal.currentMonth < cal.totalMonths) {
            cal.currentMonth++;
            cal.currentPeriod = cal.getPeriodName(cal.currentMonth);
        } else {
            console.log("🏁 Fin de la saison ! Bilan général et évolution du potentiel...");
            // Logique de fin de saison à venir...
        }

        console.log(`Mois ${cal.currentMonth - 1} terminé. Passage au mois ${cal.currentMonth} (${cal.currentPeriod})`);
        console.log("Rapport du bloc :", report);
        console.log("Bilan financier :", financialReport);

        return {
            report,
            financialReport,
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
