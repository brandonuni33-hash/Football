// gameEngine.js
import { UserInterface } from './ui.js';
import { MatchBlockManager } from './matchBlock.js';
import { EconomyManager } from './economy.js';
import { SocialSystem } from './social.js';
import { MediaSystem } from './media.js';
import { EventEngine } from './events.js';
import { CoachSystem } from './coachSystem.js';
import { TransferMarket } from './transferMarket.js';
import { TrainingManager } from './entrainement.js';
import { PlayerLogic } from './player.js';
import { StateManager, SCHEMA_VERSION } from './state.js';
import { ConsequenceSystem } from './consequenceSystem.js';
import { PotentialSystem } from './potentialSystem.js';

export class GameEngine {
    constructor() {
        this.state = StateManager.load();
        this.socialSystem = new SocialSystem(this);
        this.mediaSystem = new MediaSystem(this);

        if (this.state?.player) {
            this.migrateLoadedState();
            ConsequenceSystem.initialize(this.state.player);
            PotentialSystem.ensure(this.state.player);
        }

        this.ui = new UserInterface(this);
    }

    migrateLoadedState() {
        const player = this.state.player;

        // Migration des sauvegardes v2 : le nouveau système utilise un modèle
        // de progression unique, mais conserve les statistiques historiques.
        if (!player.progression) {
            const migrated = PlayerLogic.createPlayerProfile({
                firstname: player.firstname || player.firstName,
                lastname: player.lastname || player.lastName,
                nationality: player.nationality || player.country,
                country: player.country || player.nationality,
                position: player.position || 'BU',
                origin: player.origin || 'CENTRE_FORMATION',
                heartClub: player.heartClub
            });

            if (player.attributes) {
                migrated.attributes = {
                    ...migrated.attributes,
                    ...Object.fromEntries(
                        ['vitesse', 'tir', 'passe', 'dribble', 'defense', 'physique', 'mental']
                            .filter(key => player.attributes[key] !== undefined)
                            .map(key => [key, player.attributes[key]])
                    )
                };
            }

            migrated.overall = player.overall ?? migrated.overall;
            migrated.potential = player.potential ?? migrated.potential;
            migrated.age = player.age ?? migrated.age;
            migrated.club = player.club ?? null;
            migrated.salary = player.salary ?? 0;
            migrated.fame = player.fame ?? 10;
            migrated.morale = player.morale ?? 80;
            migrated.fitness = player.fitness ?? 90;
            migrated.isInjured = !!player.isInjured;
            migrated.injuryDuration = player.injuryDuration ?? 0;
            migrated.stats = {
                ...migrated.stats,
                ...(player.stats || {})
            };
            migrated.hidden = {
                ...migrated.hidden,
                ...(player.hidden || {})
            };

            PlayerLogic.syncProgressionFromCanonical(migrated);
            this.state.player = migrated;
        }

        this.state.trainingFocus ||= 'TECHNIQUE';
        this.state.career ||= { balance: 0, seasonHistory: [], totalCareerIncome: 0 };
        this.state.calendar ||= {
            currentMonth: 8,
            currentSeasonYear: 2026,
            currentPeriod: 'Pré-saison & Début de championnat'
        };
        this.state.social ||= this.socialSystem.initSocialData(
            this.state.player.coachName || 'l’entraîneur'
        );
        this.state.media ||= this.mediaSystem.initMediaData();

        this.socialSystem.ensureRelationships(this.state);

        this.state.social.coachData ||= {
            name: this.state.player.coachName || 'l’entraîneur',
            relation: this.state.player.stats?.relationCoach ?? 50,
            opinion: 'Neutre',
            hasLeftClub: false
        };
    }

    startCareer(selectedData = {}) {
        const player = PlayerLogic.createPlayerProfile({
            ...selectedData,
            firstname: selectedData.firstname,
            lastname: selectedData.lastname,
            firstName: selectedData.firstname,
            lastName: selectedData.lastname,
            country: selectedData.country,
            nationality: selectedData.country,
            position: selectedData.position,
            origin: selectedData.origin,
            heartClub: selectedData.heartClub
        });

        const youthClub = selectedData.youthClub || null;
        const youthClubName = youthClub?.name || 'Centre de Formation';
        const coachName = selectedData.coachName || 'l’entraîneur';
        const coachVision = selectedData.coachVision || 'Formateur Patient';

        const contract = EconomyManager.calculateContractOffer(
            youthClub,
            player
        );

        player.club = youthClubName;
        player.salary = Number(
            youthClub?.salary ??
            youthClub?.weeklySalary ??
            contract.weeklySalary ??
            150
        );
        player.coachName = coachName;
        player.coachVision = coachVision;

        const social = this.socialSystem.initSocialData(coachName);
        social.coachVision = coachVision;
        social.youthClubName = youthClubName;
        social.coachData = {
            name: coachName,
            relation: 50,
            opinion: 'Neutre',
            hasLeftClub: false
        };

        this.state = {
            schemaVersion: SCHEMA_VERSION,
            player,
            trainingFocus: 'TECHNIQUE',
            social,
            media: this.mediaSystem.initMediaData(),
            career: {
                balance: contract.signingBonus || 0,
                seasonHistory: [],
                totalCareerIncome: contract.signingBonus || 0
            },
            contract: {
                weeklySalary: player.salary,
                signingBonus: contract.signingBonus || 0,
                durationYears: contract.durationYears || 2
            },
            calendar: {
                currentMonth: 8,
                currentSeasonYear: new Date().getFullYear(),
                currentPeriod: 'Pré-saison & Début de championnat',
                totalMonths: 12
            },
            seasonPhase: 'pre_season',
            pendingEvent: null,
            pendingCoachEvent: null,
            pendingMediaDilemma: null,
            pendingTransferOffer: null
        };

        this.socialSystem.ensureRelationships(this.state);
        ConsequenceSystem.initialize(this.state.player);
        PotentialSystem.ensure(this.state.player);
        StateManager.save(this.state);
        console.log('Carrière créée :', this.state);

        return this.state;
    }

    playBlock(selectedChoice = null) {
        if (!this.state?.player) return null;
        if (this.state.player.retired || this.state.player.careerEnded || this.state.player.age >= 42) {
            this.state.player.careerEnded = true;
            return {
                careerEnded: true,
                report: { summary: { rating: 0, goals: 0, assists: 0, passes: 0, tackles: 0, yellowCards: 0, finance: null } }
            };
        }

        const player = this.state.player;

        // Une blessure bloque le mois courant : récupération puis calendrier.
        if (player.isInjured) {
            if (player.injuryDuration > 0) player.injuryDuration--;

            player.fitness = Math.min(100, (player.fitness || 50) + 12);

            if (player.injuryDuration <= 0) {
                player.isInjured = false;
                player.injuryDuration = 0;
            }

            const calendar = this.advanceCalendar();
            StateManager.save(this.state);

            return {
                recoveryOnly: true,
                report: {
                    summary: {
                        rating: 0,
                        goals: 0,
                        assists: 0,
                        passes: 0,
                        tackles: 0,
                        yellowCards: 0,
                        finance: null
                    }
                },
                calendar,
                event: null,
                coachEvent: null
            };
        }

        // 1. Entraînement : le seul endroit où l'XP d'entraînement est attribuée.
        const trainingReport = TrainingManager.applyTraining(
            player,
            this.state.trainingFocus
        );

        // 2. Simulation du mois.
        const report = MatchBlockManager.simulateBlock(
            this.state,
            this.state.trainingFocus,
            selectedChoice
        );

        // 3. Systèmes annexes alimentés par le même rapport.
        this.socialSystem.updateSocialCycle(this.state);

        if (typeof this.mediaSystem.generatePostAfterBlock === 'function') {
            this.mediaSystem.generatePostAfterBlock(
                this.state,
                report.summary
            );
        }

        // 4. Événements en attente : un seul événement bloquant à la fois.
        this.state.pendingEvent = EventEngine.checkAndTriggerEvent(this.state);
        this.state.pendingCoachEvent = this.state.pendingEvent
            ? null
            : CoachSystem.checkCoachInteraction(this.state);

        // 5. Offre de transfert occasionnelle.
        this.state.pendingTransferOffer = null;
        if (
            player.age >= 17 &&
            !player.isInjured &&
            Math.random() < 0.12
        ) {
            this.state.pendingTransferOffer =
                TransferMarket.generateTransferOffer(player);
        }

        const calendar = this.advanceCalendar();

        StateManager.save(this.state);

        return {
            report: {
                ...report,
                training: trainingReport
            },
            calendar,
            event: this.state.pendingEvent,
            coachEvent: this.state.pendingCoachEvent,
            transferOffer: this.state.pendingTransferOffer,
            mediaDilemma: this.state.media?.recentDilemma || null
        };
    }

    advanceCalendar() {
        const calendar = this.state.calendar;
        calendar.currentMonth += 1;

        if (calendar.currentMonth > 12) {
            calendar.currentMonth = 1;
        }

        let seasonChanged = false;

        if (calendar.currentMonth === 8) {
            this.archiveAndResetSeason();
            calendar.currentSeasonYear += 1;
            seasonChanged = true;
        }

        calendar.currentPeriod = this.getPeriodName(calendar.currentMonth);

        return {
            month: calendar.currentMonth,
            year: calendar.currentSeasonYear,
            period: calendar.currentPeriod,
            seasonChanged
        };
    }

    getPeriodName(month) {
        if (month === 8) return 'Pré-saison & Début de championnat';
        if (month >= 9 && month <= 11) return 'Première partie de saison';
        if (month === 12) return 'Mercato hivernal & Trêve';
        if (month >= 1 && month <= 4) return 'Seconde partie de saison';
        if (month === 5) return 'Sprint final & Bilan de saison';
        return 'Trêve estivale & Bilan';
    }

    setTrainingFocus(focusKey) {
        if (!this.state?.player) return false;

        if (!TrainingManager.FOCUS_TYPES[focusKey]) {
            return false;
        }

        this.state.trainingFocus = focusKey;
        StateManager.save(this.state);
        return true;
    }

    resolveEventChoice(choiceIndex) {
        if (!this.state?.pendingEvent) return null;

        const event = this.state.pendingEvent;
        const result = EventEngine.resolveChoice(
            this.state,
            event.id,
            choiceIndex
        );

        this.state.pendingEvent = null;
        PlayerLogic.syncProgressionFromCanonical(this.state.player);
        StateManager.save(this.state);

        return result;
    }

    resolveCoachChoice(choiceIndex) {
        if (!this.state?.pendingCoachEvent) return null;

        const event = this.state.pendingCoachEvent;
        const result = CoachSystem.resolveCoachChoice(
            this.state,
            choiceIndex,
            event
        );

        this.state.pendingCoachEvent = null;
        PlayerLogic.syncProgressionFromCanonical(this.state.player);
        StateManager.save(this.state);

        return result;
    }

    resolveMediaDilemma(choiceIndex) {
        if (!this.state?.media?.recentDilemma) return null;

        const result = this.mediaSystem.resolveDilemma(
            this.state,
            choiceIndex
        );

        StateManager.save(this.state);
        return result;
    }

    acceptTransferOffer() {
        const offer = this.state?.pendingTransferOffer;
        if (!offer) return null;

        const player = this.state.player;
        const oldClub = player.club;

        player.club = offer.club;
        player.salary = offer.salaireHebdo;
        this.state.social.coachData.hasLeftClub = true;
        this.state.social.coachData.previousClub = oldClub;
        this.state.pendingTransferOffer = null;

        StateManager.save(this.state);

        return {
            accepted: true,
            oldClub,
            newClub: offer.club,
            salary: offer.salaireHebdo
        };
    }

    rejectTransferOffer() {
        if (!this.state?.pendingTransferOffer) return false;
        this.state.pendingTransferOffer = null;
        StateManager.save(this.state);
        return true;
    }

    retireCareer() {
        if (!this.state?.player) return null;
        const player = this.state.player;
        if (player.age < 34) return { retired: false, reason: 'Retraite disponible à partir de 34 ans.' };

        player.retired = true;
        player.careerEnded = true;
        StateManager.save(this.state);

        return {
            retired: true,
            age: player.age,
            overall: player.overall,
            potential: player.potential
        };
    }

    archiveAndResetSeason() {
        const player = this.state.player;
        const currentYear = this.state.calendar.currentSeasonYear;

        this.state.career.seasonHistory ||= [];
        this.state.career.seasonHistory.push({
            seasonLabel: `${currentYear}/${currentYear + 1}`,
            club: player.club,
            overall: player.overall,
            age: player.age,
            matches: player.stats?.matchesPlayed || 0,
            goals: player.stats?.goals || 0,
            assists: player.stats?.assists || 0,
            averageRating: player.stats?.averageRating || 0
        });

        // Le potentiel vivant est évalué une seule fois par saison, avant
        // la remise à zéro des statistiques saisonnières.
        const potentialReport = PotentialSystem.finalizeSeason(player, {
            seasonLabel: `${currentYear}/${currentYear + 1}`,
            overall: player.overall,
            matches: player.stats?.matchesPlayed || 0,
            goals: player.stats?.goals || 0,
            assists: player.stats?.assists || 0,
            averageRating: player.stats?.averageRating || 0
        });

        // Déclin physique de fin de saison, puis vieillissement explicite.
        PlayerLogic.applyProgression(player, {
            xp: 0,
            type: 'finSaison',
            vieillirDUnAn: false
        });
        PotentialSystem.advanceAge(player);
        PlayerLogic.syncProgressionFromCanonical(player);
        player.canRetire = player.age >= 34;
        player.careerEnded = player.age >= 42;

        this.state.career.lastPotentialReport = potentialReport;

        // Réinitialisation des statistiques saisonnières.
        player.stats.matchesPlayed = 0;
        player.stats.goals = 0;
        player.stats.assists = 0;
        player.stats.successfulPasses = 0;
        player.stats.tackles = 0;
        player.stats.yellowCards = 0;
        player.stats.averageRating = 0;

        player.fitness = Math.min(100, (player.fitness || 60) + 20);
        player.isInjured = false;
        player.injuryDuration = 0;

        if (
            this.state.social?.coachData &&
            player.club !== this.state.social.youthClubName
        ) {
            this.state.social.coachData.hasLeftClub = true;
        }
    }

    resetCareer() {
        StateManager.clear();
        this.state = null;
        this.ui.activeApp = 'home';
        this.ui.currentStep = 1;
        this.ui.selectedData = {
            firstname: '',
            lastname: '',
            position: null,
            continent: null,
            country: null,
            origin: null,
            heartClub: null,
            youthClub: null,
            coachVision: null,
            coachName: null
        };
        this.ui.render();
    }
}
