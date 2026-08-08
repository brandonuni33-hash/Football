// gameEngine.js
import { UserInterface } from './ui.js';
import { MatchBlockManager } from './matchBlock.js';
import { EconomyManager } from './economy.js';
import { SocialSystem } from './social.js';
import { MediaSystem } from './media.js';
import { EventEngine } from './events.js';
import { TrainingManager } from './entrainement.js'; // Import du manager d'entraînement

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
        const initialOvr = selectedData.ovr || Math.floor(Math.random() * 11) + 35;
        const potentialOvr = selectedData.pot || initialOvr + Math.floor(Math.random() * 25) + 15;

        const tempPlayerForEconomy = {
            overall: initialOvr,
            age: 16
        };

        const contract = EconomyManager.calculateContractOffer(selectedData.youthClub, tempPlayerForEconomy);

        this.state = {
            player: {
                firstname: selectedData.firstName || selectedData.firstname,
                lastname: selectedData.lastName || selectedData.lastname,
                position: selectedData.position,
                age: 16,
                club: selectedData.youthClub.name,
                salary: contract.weeklySalary,
                overall: initialOvr,
                fame: selectedData.stats?.reputation || 10,
                morale: 80,
                fitness: 90,
                isInjured: false,
                injuryDuration: 0, // Ajouté pour suivre le nombre de blocs d'absence
                
                stats: selectedData.stats || {
                    technique: initialOvr,
                    physique: initialOvr,
                    mental: initialOvr,
                    charisme: 50,
                    reputation: 10,
                    discipline: 50,
                    relationCoach: 50,
                    vestiaire: 50,
                    matchesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    successfulPasses: 0,
                    tackles: 0,
                    averageRating: 0.0
                },
                potential: potentialOvr,

                attributes: selectedData.hidden || {
                    consistency: Math.floor(Math.random() * 8) + 8,
                    bigMatchPlayer: Math.floor(Math.random() * 8) + 8,
                    injuryProneness: Math.floor(Math.random() * 10) + 6
                }
            },
            // Ajout du focus d'entraînement par défaut dans le state global
            trainingFocus: 'TECHNIQUE', 
            social: this.socialSystem.initSocialData(selectedData.coachName),
            media: this.mediaSystem.initMediaData(),
            career: {
                balance: 0,
                seasonHistory: []
            },
            calendar: {
                currentMonth: 8,     
                currentSeasonYear: 2026,
                totalMonths: 12,
                currentPeriod: "Reprise & Pré-saison",
                getPeriodName(month) {
                    if (month === 8) return "Pré-saison & Début de championnat";
                    if (month >= 9 && month <= 11) return "Première partie de saison";
                    if (month === 12) return "Mercato hivernal & Trêve";
                    if (month >= 1 && month <= 4) return "Seconde partie de saison";
                    if (month === 5) return "Sprint final & Bilan de saison";
                    return "Trêve estivale & Bilan";
                }
            },
            seasonPhase: 'pre_season'
        };

        console.log("Carrière lancée avec succès (Août) !", this.state);
    }

    /**
     * Permet de simuler un bloc de 4 matchs (1 mois) via le MatchBlockManager
     */
    playBlock() {
        if (!this.state) return;

        // Si le joueur est blessé, on décrémente la durée au lieu de bloquer bêtement
        if (this.state.player.isInjured) {
            if (this.state.player.injuryDuration > 0) {
                this.state.player.injuryDuration--;
            }
            if (this.state.player.injuryDuration <= 0) {
                this.state.player.isInjured = false;
                this.state.player.injuryDuration = 0;
            }
        }

        // On passe le focus d'entraînement actuel stocké dans le state au simulateur
        const report = MatchBlockManager.simulateBlock(this.state, this.state.trainingFocus);

        this.socialSystem.updateSocialCycle(this.state);
        this.mediaSystem.generatePostAfterBlock(this.state, report);

        const triggeredEvent = EventEngine.checkAndTriggerEvent ? EventEngine.checkAndTriggerEvent(this.state) : null;
        if (triggeredEvent) {
            console.log("⚡ Événement déclenché :", triggeredEvent.titre);
            this.state.pendingEvent = triggeredEvent;
        }

        // Gestion du calendrier (Août -> Juillet)
        const cal = this.state.calendar;
        
        if (cal.currentMonth < 12) {
            cal.currentMonth++;
        } else {
            this.archiveAndResetSeason();
            cal.currentMonth = 8; 
            cal.currentSeasonYear++;
        }
        
        cal.currentPeriod = cal.getPeriodName(cal.currentMonth);

        console.log(`Mois terminé. Passage au mois ${cal.currentMonth} (${cal.currentPeriod}) - Saison ${cal.currentSeasonYear}/${cal.currentSeasonYear + 1}`);

        return {
            report,
            calendar: {
                month: cal.currentMonth,
                year: cal.currentSeasonYear,
                period: cal.currentPeriod
            },
            event: triggeredEvent || null
        };
    }

    /**
     * Permet à l'UI de modifier le focus d'entraînement en cours
     */
    setTrainingFocus(focusKey) {
        if (!this.state) return;
        this.state.trainingFocus = focusKey;
        console.log(`Focus d'entraînement mis à jour : ${focusKey}`);
    }

    /**
     * Archive la saison écoulée en juin/juillet et réinitialise les stats de club pour la rentrée d'août
     */
    archiveAndResetSeason() {
        const player = this.state.player;
        const currentYear = this.state.calendar.currentSeasonYear;

        const seasonSummary = {
            seasonLabel: `${currentYear}/${currentYear + 1}`,
            club: player.club,
            overall: player.overall,
            age: player.age,
            stats: { ...player.stats }
        };

        if (!this.state.career.seasonHistory) {
            this.state.career.seasonHistory = [];
        }
        this.state.career.seasonHistory.push(seasonSummary);

        player.age += 1;

        player.stats.matchesPlayed = 0;
        player.stats.goals = 0;
        player.stats.assists = 0;
        player.stats.successfulPasses = 0;
        player.stats.tackles = 0;
        player.stats.averageRating = 0.0;

        console.log("📁 Saison archivée et statistiques de club réinitialisées pour la nouvelle rentrée en Août !", seasonSummary);
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
