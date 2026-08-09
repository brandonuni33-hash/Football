// gameEngine.js
import { UserInterface } from './ui.js';

// Importations sécurisées avec fallbacks par défaut pour éviter tout crash au démarrage
import { MatchBlockManager as _MatchBlockManager } from './matchBlock.js';
import { EconomyManager as _EconomyManager } from './economy.js';
import { SocialSystem as _SocialSystem } from './social.js';
import { MediaSystem as _MediaSystem } from './media.js';
import { EventEngine as _EventEngine } from './events.js';
import { CoachSystem as _CoachSystem } from './coachSystem.js';

const MatchBlockManager = _MatchBlockManager || { simulateBlock: () => ({}) };
const EconomyManager = _EconomyManager || { calculateContractOffer: () => ({ weeklySalary: 150 }) };
const SocialSystem = _SocialSystem || class { 
    constructor() {} 
    initSocialData() { return {}; } 
    updateSocialCycle() {} 
};
const MediaSystem = _MediaSystem || class { 
    constructor() {} 
    initMediaData() { return { followers: 0, hypeLevel: 0, feed: [] }; } 
    generatePostAfterBlock() {} 
    resolveDilemma() {} 
};
const EventEngine = _EventEngine || { checkAndTriggerEvent: () => null };
const CoachSystem = _CoachSystem || { checkCoachInteraction: () => null, resolveCoachChoice: () => null };

export class GameEngine {
    constructor() {
        this.state = null;
        this.socialSystem = new SocialSystem(this);
        this.mediaSystem = new MediaSystem(this);
        this.ui = new UserInterface(this);
    }

    startCareer(selectedData) {
        const initialOvr = selectedData?.ovr || Math.floor(Math.random() * 11) + 35;
        const potentialOvr = selectedData?.pot || initialOvr + Math.floor(Math.random() * 25) + 15;
        
        const tempPlayerForEconomy = { overall: initialOvr, age: 16 };
        const contract = EconomyManager.calculateContractOffer(selectedData?.youthClub, tempPlayerForEconomy);

        const coachName = selectedData?.coachName || "l'entraîneur";
        const youthClubName = selectedData?.youthClub?.name || "Centre de Formation";

        this.state = {
            player: {
                firstname: selectedData?.firstName || selectedData?.firstname || 'Joueur',
                lastname: selectedData?.lastName || selectedData?.lastname || 'Inconnu',
                position: selectedData?.position || 'BU',
                age: 16,
                club: youthClubName,
                salary: contract?.weeklySalary || 150,
                overall: initialOvr,
                fame: selectedData?.stats?.reputation || 10,
                morale: 80,
                fitness: 90,
                isInjured: false,
                injuryDuration: 0,
                stats: selectedData?.stats || {
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
                    vitesse: initialOvr,
                    tir: initialOvr,
                    passe: initialOvr,
                    dribble: initialOvr,
                    defense: initialOvr,
                    physique: initialOvr,
                    mental: initialOvr
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
                youthClubName: youthClubName
            },
            media: this.mediaSystem.initMediaData(),
            career: {
                balance: 0,
                seasonHistory: []
            },
            calendar: {
                currentMonth: 8, // Début en Août
                currentSeasonYear: 2026,
                totalMonths: 12,
                currentPeriod: "Pré-saison & Début de championnat"
            },
            seasonPhase: 'pre_season',
            pendingMatchDilemma: null,
            pendingCoachEvent: null
        };

        console.log("Carrière lancée avec succès (Août) !", this.state);
    }

    playBlock(selectedChoice = null) {
        if (!this.state) return;

        // 1. Gestion des blessures
        if (this.state.player.isInjured) {
            if (this.state.player.injuryDuration > 0) this.state.player.injuryDuration--;
            if (this.state.player.injuryDuration <= 0) {
                this.state.player.isInjured = false;
                this.state.player.injuryDuration = 0;
            }
        }

        // 2. Simulation du bloc de matchs et progression
        const report = MatchBlockManager.simulateBlock(this.state, this.state.trainingFocus, selectedChoice);
        this.state.pendingMatchDilemma = null;

        if (typeof this.socialSystem.updateSocialCycle === 'function') {
            this.socialSystem.updateSocialCycle(this.state);
        }
        if (typeof this.mediaSystem.generatePostAfterBlock === 'function') {
            this.mediaSystem.generatePostAfterBlock(this.state, report);
        }

        // 3. Déclenchement des événements aléatoires
        const triggeredEvent = EventEngine.checkAndTriggerEvent ? EventEngine.checkAndTriggerEvent(this.state) : null;
        if (triggeredEvent) this.state.pendingEvent = triggeredEvent;

        const coachEvent = CoachSystem.checkCoachInteraction ? CoachSystem.checkCoachInteraction(this.state) : null;
        if (coachEvent) this.state.pendingCoachEvent = coachEvent;

        // 4. Avancement CORRECT du Calendrier 
        const cal = this.state.calendar;
        cal.currentMonth++;

        // Passage à la nouvelle année civile (Janvier)
        if (cal.currentMonth > 12) {
            cal.currentMonth = 1;
        }

        // Si on revient en Août, c'est le début d'une nouvelle saison
        if (cal.currentMonth === 8) {
            this.archiveAndResetSeason();
            cal.currentSeasonYear++; // On incrémente l'année de la saison (ex: 2026 -> 2027)
        }

        cal.currentPeriod = this.getPeriodName(cal.currentMonth);

        return {
            report,
            calendar: { month: cal.currentMonth, year: cal.currentSeasonYear, period: cal.currentPeriod },
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
        // Ajout explicite pour Juin (6) et Juillet (7) pour éviter un undefined
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

        if (this.state.social?.coachData && player.club !== this.state.social.youthClubName) {
            this.state.social.coachData.hasLeftClub = true;
        }

        player.age += 1;
        
        // Reset des stats annuelles
        player.stats.matchesPlayed = 0;
        player.stats.goals = 0;
        player.stats.assists = 0;
        player.stats.successfulPasses = 0;
        player.stats.tackles = 0;
        player.stats.averageRating = 0.0;
    }

    resolveMediaDilemma(choiceIndex) {
        if (!this.state) return;
        if (typeof this.mediaSystem.resolveDilemma === 'function') {
            this.mediaSystem.resolveDilemma(this.state, choiceIndex);
        }
    }
}
