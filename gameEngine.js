// gameEngine.js
import { UserInterface } from './ui.js';
import { MatchBlockManager } from './matchBlock.js';
import { EconomyManager } from './economy.js';
import { SocialSystem } from './social.js';
import { MediaSystem } from './media.js';
import { EventEngine } from './events.js';
import { TrainingManager } from './entrainement.js';
import { CoachSystem } from './coachSystem.js';
import { MatchChoiceManager } from './matchChoices.js';

export class GameEngine {
    constructor() {
        this.state = null;
        this.socialSystem = new SocialSystem(this);
        this.mediaSystem = new MediaSystem(this);
        this.ui = new UserInterface(this);
    }

    startCareer(selectedData) {
        const initialOvr = selectedData.ovr || Math.floor(Math.random() * 11) + 35;
        const potentialOvr = selectedData.pot || initialOvr + Math.floor(Math.random() * 25) + 15;
        
        const tempPlayerForEconomy = {
            overall: initialOvr,
            age: 16
        };
        const contract = EconomyManager.calculateContractOffer(selectedData.youthClub, tempPlayerForEconomy);

        const coachName = selectedData.coachName || "l'entraîneur";

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
                injuryDuration: 0,
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
                attributes: {
                    vitesse: initialOvr + Math.floor(Math.random() * 7) - 3,
                    tir: initialOvr + Math.floor(Math.random() * 7) - 3,
                    passe: initialOvr + Math.floor(Math.random() * 7) - 3,
                    dribble: initialOvr + Math.floor(Math.random() * 7) - 3,
                    defense: initialOvr + Math.floor(Math.random() * 7) - 3,
                    physique: initialOvr + Math.floor(Math.random() * 7) - 3,
                    mental: initialOvr + Math.floor(Math.random() * 7) - 3
                }
            },
            trainingFocus: 'TECHNIQUE',
            social: {
                ...this.socialSystem.initSocialData(coachName),
                coachData: {
                    name: coachName,
                    relation: 50,
                    opinion: "Neutre",
                    hasLeftClub: false
                },
                youthClubName: selectedData.youthClub.name
            },
            media: this.mediaSystem.initMediaData(),
            career: {
                balance: 0,
                seasonHistory: []
            },
            calendar: {
                currentMonth: 8,
                currentSeasonYear: 2026,
                totalMonths: 12,
                currentPeriod: "Reprise & Pré-saison"
            },
            seasonPhase: 'pre_season',
            pendingMatchDilemma: null,
            pendingCoachEvent: null
        };

        console.log("Carrière lancée avec succès (Août) !", this.state);
    }

    playBlock(selectedChoice = null) {
        if (!this.state) return;

        if (this.state.player.isInjured) {
            if (this.state.player.injuryDuration > 0) {
                this.state.player.injuryDuration--;
            }
            if (this.state.player.injuryDuration <= 0) {
                this.state.player.isInjured = false;
                this.state.player.injuryDuration = 0;
            }
        }

        const report = MatchBlockManager.simulateBlock(this.state, this.state.trainingFocus, selectedChoice);
        this.state.pendingMatchDilemma = null;

        this.socialSystem.updateSocialCycle(this.state);
        this.mediaSystem.generatePostAfterBlock(this.state, report);

        const triggeredEvent = EventEngine.checkAndTriggerEvent ? EventEngine.checkAndTriggerEvent(this.state) : null;
        if (triggeredEvent) {
            this.state.pendingEvent = triggeredEvent;
        }

        const coachEvent = CoachSystem.checkCoachInteraction(this.state);
        if (coachEvent) {
            this.state.pendingCoachEvent = coachEvent;
        }

        const cal = this.state.calendar;
        if (cal.currentMonth < 12) {
            cal.currentMonth++;
        } else {
            this.archiveAndResetSeason();
            cal.currentMonth = 8;
            cal.currentSeasonYear++;
        }

        cal.currentPeriod = this.getPeriodName(cal.currentMonth);

        return {
            report,
            calendar: {
                month: cal.currentMonth,
                year: cal.currentSeasonYear,
                period: cal.currentPeriod
            },
            event: triggeredEvent || null,
            coachEvent: coachEvent || null
        };
    }

    getPeriodName(month) {
        if (month === 8) return "Pré-saison & Début de championnat";
        if (month >= 9 && month <= 11) return "Première partie de saison";
        if (month === 12) return "Mercato hivernal & Trêve";
        if (month >= 1 && month <= 4) return "Seconde partie de saison";
        if (month === 5) return "Sprint final & Bilan de saison";
        return "Trêve estivale & Bilan";
    }

    setTrainingFocus(focusKey) {
        if (!this.state) return;
        this.state.trainingFocus = focusKey;
    }

    resolveCoachChoice(choiceIndex) {
        if (!this.state || !this.state.pendingCoachEvent) return null;
        const result = CoachSystem.resolveCoachChoice(this.state, choiceIndex, this.state.pendingCoachEvent);
        this.state.pendingCoachEvent = null;
        return result;
    }

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

        if (this.state.social && this.state.social.coachData) {
            if (player.club !== this.state.social.youthClubName) {
                this.state.social.coachData.hasLeftClub = true;
            }
        }

        player.age += 1;
        player.stats.matchesPlayed = 0;
        player.stats.goals = 0;
        player.stats.assists = 0;
        player.stats.successfulPasses = 0;
        player.stats.tackles = 0;
        player.stats.averageRating = 0.0;
    }

    resolveMediaDilemma(choiceIndex) {
        if (!this.state) return;
        this.mediaSystem.resolveDilemma(this.state, choiceIndex);
    }
}
