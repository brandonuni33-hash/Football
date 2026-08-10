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
import { CareerSystem } from './careerSystem.js';
import { CompetitionSystem } from './competitionSystem.js';
import { WorldSystem } from './worldSystem.js';
import { CupSystem } from './cupSystem.js';

export class GameEngine {
    constructor() {
        this.state = StateManager.load();

        this.socialSystem = new SocialSystem(this);
        this.mediaSystem = new MediaSystem(this);

        if (this.state?.player) {
            this.migrateLoadedState();

            ConsequenceSystem.initialize(this.state.player);
            PotentialSystem.ensure(this.state.player);
            CareerSystem.refreshStage(this.state.player);

            WorldSystem.ensureWorld(this.state);
            CupSystem.ensure(this.state);
        }

        this.ui = new UserInterface(this);
    }

    migrateLoadedState() {
        const player = this.state.player;

        // Migration des anciennes sauvegardes.
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
                        [
                            'vitesse',
                            'tir',
                            'passe',
                            'dribble',
                            'defense',
                            'physique',
                            'mental'
                        ]
                            .filter(
                                key =>
                                    player.attributes[key] !== undefined
                            )
                            .map(
                                key => [
                                    key,
                                    player.attributes[key]
                                ]
                            )
                    )
                };
            }

            migrated.overall =
                player.overall ?? migrated.overall;

            migrated.potential =
                player.potential ?? migrated.potential;

            migrated.age =
                player.age ?? migrated.age;

            migrated.club =
                player.club ?? null;

            migrated.salary =
                player.salary ?? 0;

            migrated.fame =
                player.fame ?? 10;

            migrated.morale =
                player.morale ?? 80;

            migrated.fitness =
                player.fitness ?? 90;

            migrated.isInjured =
                !!player.isInjured;

            migrated.injuryDuration =
                player.injuryDuration ?? 0;

            migrated.stats = {
                ...migrated.stats,
                ...(player.stats || {})
            };

            migrated.hidden = {
                ...migrated.hidden,
                ...(player.hidden || {})
            };

            PlayerLogic.syncProgressionFromCanonical(
                migrated
            );

            this.state.player = migrated;
        }

        if (!this.state.player.careerProfile) {
            CareerSystem.initialize(
                this.state.player,
                {
                    name:
                        this.state.player.club ||
                        'Centre de Formation',

                    prestige: 40,

                    country:
                        this.state.player.clubCountry ||
                        this.state.player.country ||
                        'France'
                }
            );
        } else {
            CareerSystem.refreshStage(
                this.state.player
            );

            WorldSystem.ensureWorld(
                this.state
            );
        }

        this.state.careerStructure =
            this.state.player.careerProfile;

        this.state.trainingFocus ||=
            'TECHNIQUE';

        this.state.career ||= {
            balance: 0,
            seasonHistory: [],
            totalCareerIncome: 0
        };

        this.state.calendar ||= {
            currentMonth: 8,
            currentSeasonYear: 2026,
            currentPeriod:
                'Pré-saison & reprise',
            seasonSchedule: null,
            seasonMatchCursor: 0
        };

        CompetitionSystem.ensureSeasonSchedule(
            this.state
        );

        this.state.social ||=
            this.socialSystem.initSocialData(
                this.state.player.coachName ||
                'l’entraîneur'
            );

        this.state.media ||=
            this.mediaSystem.initMediaData();

        this.socialSystem.ensureRelationships(
            this.state
        );

        this.state.social.coachData ||= {
            name:
                this.state.player.coachName ||
                'l’entraîneur',

            relation:
                this.state.player.stats
                    ?.relationCoach ?? 50,

            opinion: 'Neutre',

            hasLeftClub: false
        };

        // Phase 2D :
        // initialise les coupes nationales
        // sans modifier le club du joueur.
        CupSystem.ensure(this.state);
    }

    startCareer(selectedData = {}) {
        const player =
            PlayerLogic.createPlayerProfile({
                ...selectedData,

                firstname:
                    selectedData.firstname,

                lastname:
                    selectedData.lastname,

                firstName:
                    selectedData.firstname,

                lastName:
                    selectedData.lastname,

                country:
                    selectedData.country,

                nationality:
                    selectedData.country,

                position:
                    selectedData.position,

                origin:
                    selectedData.origin,

                heartClub:
                    selectedData.heartClub
            });

        const youthClub =
            selectedData.youthClub || null;

        const youthClubName =
            youthClub?.name ||
            'Centre de Formation';

        const coachName =
            selectedData.coachName ||
            'l’entraîneur';

        const coachVision =
            selectedData.coachVision ||
            'Formateur Patient';

        const contract =
            EconomyManager.calculateContractOffer(
                youthClub,
                player
            );

        player.club =
            youthClubName;

        player.clubCountry =
            youthClub?.country ||
            player.clubCountry ||
            player.country ||
            'France';

        player.clubLevel =
            Number(youthClub?.tier) ||
            player.clubLevel ||
            1;

        // Le joueur reste attaché à son centre
        // pendant toute la période jeune.
        player.youthClubName =
            youthClubName;

        player.youthClubData =
            youthClub
                ? { ...youthClub }
                : null;

        player.isYouthPlayer =
            Number(player.age) < 18;

        // Aucun rattachement senior avant 18 ans.
        if (!player.isYouthPlayer) {
            WorldSystem.normalizeCareerClub(
                player
            );
        }

        CareerSystem.initialize(
            player,
            youthClub ||
                (
                    player.clubId
                        ? WorldSystem.getClub(
                            player.clubId
                        )
                        : null
                )
        );

        player.contract = {
            ...player.contract,
            ...contract
        };

        player.salary = Number(
            youthClub?.salary ??
            youthClub?.weeklySalary ??
            contract.weeklySalary ??
            150
        );

        player.coachName =
            coachName;

        player.coachVision =
            coachVision;

        const social =
            this.socialSystem.initSocialData(
                coachName
            );

        social.coachVision =
            coachVision;

        social.youthClubName =
            youthClubName;

        social.coachData = {
            name: coachName,
            relation: 50,
            opinion: 'Neutre',
            hasLeftClub: false
        };

        this.state = {
            schemaVersion:
                SCHEMA_VERSION,

            player,

            trainingFocus:
                'TECHNIQUE',

            social,

            media:
                this.mediaSystem.initMediaData(),

            career: {
                balance:
                    contract.signingBonus ||
                    0,

                seasonHistory: [],

                totalCareerIncome:
                    contract.signingBonus ||
                    0
            },

            contract: {
                weeklySalary:
                    player.salary,

                signingBonus:
                    contract.signingBonus ||
                    0,

                durationYears:
                    contract.durationYears ||
                    2
            },

            calendar: {
                currentMonth: 8,

                currentSeasonYear:
                    new Date().getFullYear(),

                currentPeriod:
                    'Pré-saison & reprise',

                totalMonths: 12,

                seasonSchedule: null,

                seasonMatchCursor: 0
            },

            seasonPhase:
                'pre_season',

            pendingEvent: null,

            pendingCoachEvent: null,

            pendingMediaDilemma: null,

            pendingTransferOffer: null,

            pendingPositionProposal: null,

            world: {
                version: 1,
                leagues: {},
                lastSeasonFinalized: null
            },

            cups: {},

            careerStructure:
                player.careerProfile ||
                null
        };

        this.socialSystem.ensureRelationships(
            this.state
        );

        ConsequenceSystem.initialize(
            this.state.player
        );

        PotentialSystem.ensure(
            this.state.player
        );

        CareerSystem.refreshStage(
            this.state.player
        );

        WorldSystem.ensureWorld(
            this.state
        );

        // Phase 2D :
        // initialise les cinq coupes nationales.
        CupSystem.ensure(
            this.state
        );

        this.state.careerStructure =
            this.state.player
                .careerProfile ||
            null;

        StateManager.save(
            this.state
        );

        console.log(
            'Carrière créée :',
            this.state
        );

        return this.state;
    }

    playBlock(selectedChoice = null) {
        if (!this.state?.player) {
            return null;
        }

        if (
            this.state.player.retired ||
            this.state.player.careerEnded ||
            this.state.player.age >= 42
        ) {
            this.state.player.careerEnded =
                true;

            return {
                careerEnded: true,

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
                }
            };
        }

        const player =
            this.state.player;

        // Une blessure bloque le mois courant.
        if (player.isInjured) {
            if (
                player.injuryDuration > 0
            ) {
                player.injuryDuration--;
            }

            player.fitness =
                Math.min(
                    100,
                    (player.fitness || 50) +
                    12
                );

            if (
                player.injuryDuration <= 0
            ) {
                player.isInjured =
                    false;

                player.injuryDuration =
                    0;
            }

            const calendar =
                this.advanceCalendar();

            StateManager.save(
                this.state
            );

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

        // 1. Entraînement.
        const trainingReport =
            TrainingManager.applyTraining(
                player,
                this.state.trainingFocus
            );

        // 2. Simulation du bloc mensuel.
        const report =
            MatchBlockManager.simulateBlock(
                this.state,
                this.state.trainingFocus,
                selectedChoice
            );

        // 3. Classement réel.
        WorldSystem.recordPlayerMatches(
            this.state,
            report.summary?.scheduledMatches ||
                [],
            report.summary || {}
        );

        // 4. Systèmes sociaux et médias.
        this.socialSystem.updateSocialCycle(
            this.state
        );

        if (
            typeof this.mediaSystem
                .generatePostAfterBlock ===
            'function'
        ) {
            this.mediaSystem.generatePostAfterBlock(
                this.state,
                report.summary
            );
        }

        // 5. Événements.
        this.state.pendingEvent =
            EventEngine.checkAndTriggerEvent(
                this.state
            );

        this.state.pendingCoachEvent =
            this.state.pendingEvent
                ? null
                : CoachSystem.checkCoachInteraction(
                    this.state
                );

        // 6. Développement de carrière.
        CareerSystem.refreshStage(
            player
        );

        const discoveredRole =
            CareerSystem.detectRole(
                player
            );

        const positionProposal =
            CareerSystem.evaluatePositionChange(
                player
            );

        this.state.pendingPositionProposal =
            positionProposal || null;

        // 7. Recrutement / transferts.
        this.state.pendingTransferOffer =
            null;

        if (!player.isInjured) {
            if (player.age < 22) {
                this.state.pendingTransferOffer =
                    CareerSystem.recruitmentOffer(
                        player
                    );
            }

            if (
                !this.state.pendingTransferOffer &&
                player.age >= 18 &&
                Math.random() < 0.08
            ) {
                this.state.pendingTransferOffer =
                    TransferMarket.generateTransferOffer(
                        player
                    );
            }
        }

        // 8. Calendrier.
        const calendar =
            this.advanceCalendar();

        StateManager.save(
            this.state
        );

        return {
            report: {
                ...report,
                training:
                    trainingReport
            },

            calendar,

            event:
                this.state.pendingEvent,

            coachEvent:
                this.state.pendingCoachEvent,

            transferOffer:
                this.state.pendingTransferOffer,

            mediaDilemma:
                this.state.media
                    ?.recentDilemma ||
                null,

            positionProposal:
                this.state
                    .pendingPositionProposal,

            discoveredRole
        };
    }

    advanceCalendar() {
        const calendar =
            this.state.calendar;

        // Le monde entier évolue pendant
        // les mois de compétition.
        if (
            !WorldSystem.isOffSeason?.(
                calendar.currentMonth
            )
        ) {
            WorldSystem.simulateAllLeaguesMonth(
                this.state,
                Number(
                    calendar.currentSeasonYear
                ) * 100 +
                Number(
                    calendar.currentMonth
                )
            );
        }

        // Phase 2D :
        // les coupes restent initialisées
        // pendant la saison.
        CupSystem.ensure(
            this.state
        );

        calendar.currentMonth += 1;

        if (
            calendar.currentMonth > 12
        ) {
            calendar.currentMonth = 1;
        }

        let seasonChanged = false;

        // Août = nouvelle saison.
        if (
            calendar.currentMonth === 8
        ) {
            // Archivage des coupes de la saison
            // qui vient de se terminer.
            CupSystem.finalizeSeason(
                this.state
            );

            const divisionMovements =
                WorldSystem.finalizeSeason(
                    this.state
                );

            this.state.career
                .lastDivisionMovements =
                divisionMovements;

            this.archiveAndResetSeason();

            calendar.currentSeasonYear += 1;

            calendar.seasonSchedule =
                null;

            calendar.seasonMatchCursor =
                0;

            WorldSystem.resetSeasonTables(
                this.state,
                calendar.currentSeasonYear
            );

            // Nouvelle saison :
            // nouvelles coupes nationales.
            CupSystem.ensure(
                this.state
            );

            seasonChanged = true;
        }

        calendar.currentPeriod =
            CompetitionSystem.getPeriodName(
                calendar.currentMonth
            );

        CompetitionSystem.ensureSeasonSchedule(
            this.state
        );

        return {
            month:
                calendar.currentMonth,

            year:
                calendar.currentSeasonYear,

            period:
                calendar.currentPeriod,

            seasonChanged
        };
    }

    getPeriodName(month) {
        return CompetitionSystem.getPeriodName(
            month
        );
    }

    setTrainingFocus(focusKey) {
        if (!this.state?.player) {
            return false;
        }

        if (
            !TrainingManager.FOCUS_TYPES[
                focusKey
            ]
        ) {
            return false;
        }

        this.state.trainingFocus =
            focusKey;

        StateManager.save(
            this.state
        );

        return true;
    }

    resolveEventChoice(choiceIndex) {
        if (!this.state?.pendingEvent) {
            return null;
        }

        const event =
            this.state.pendingEvent;

        const result =
            EventEngine.resolveChoice(
                this.state,
                event.id,
                choiceIndex
            );

        this.state.pendingEvent =
            null;

        PlayerLogic.syncProgressionFromCanonical(
            this.state.player
        );

        StateManager.save(
            this.state
        );

        return result;
    }

    resolveCoachChoice(choiceIndex) {
        if (
            !this.state?.pendingCoachEvent
        ) {
            return null;
        }

        const event =
            this.state.pendingCoachEvent;

        const result =
            CoachSystem.resolveCoachChoice(
                this.state,
                choiceIndex,
                event
            );

        this.state.pendingCoachEvent =
            null;

        PlayerLogic.syncProgressionFromCanonical(
            this.state.player
        );

        StateManager.save(
            this.state
        );

        return result;
    }

    resolveMediaDilemma(choiceIndex) {
        if (
            !this.state?.media
                ?.recentDilemma
        ) {
            return null;
        }

        const result =
            this.mediaSystem.resolveDilemma(
                this.state,
                choiceIndex
            );

        StateManager.save(
            this.state
        );

        return result;
    }

    resolvePositionProposal(accepted) {
        const proposal =
            this.state
                ?.pendingPositionProposal;

        if (!proposal) {
            return false;
        }

        const result =
            CareerSystem.applyPositionChange(
                this.state.player,
                !!accepted,
                proposal
            );

        this.state.pendingPositionProposal =
            null;

        this.state.careerStructure =
            this.state.player
                .careerProfile ||
            null;

        PlayerLogic.syncProgressionFromCanonical(
            this.state.player
        );

        StateManager.save(
            this.state
        );

        return result;
    }

    acceptTransferOffer() {
        const offer =
            this.state?.pendingTransferOffer;

        if (!offer) {
            return null;
        }

        const player =
            this.state.player;

        const oldClub =
            player.club;

        const newClub =
            WorldSystem.getClub(
                offer.club
            );

        player.club =
            offer.club;

        player.clubId =
            newClub?.id ||
            player.clubId ||
            null;

        player.clubCountry =
            newClub?.country ||
            player.clubCountry;

        player.clubLevel =
            newClub?.tier ||
            player.clubLevel ||
            1;

        player.leagueId =
            newClub?.leagueId ||
            player.leagueId;

        player.clubPrestige =
            newClub?.prestige ||
            player.clubPrestige;

        player.centerStars =
            newClub?.centerStars ||
            player.centerStars;

        player.salary =
            offer.salaireHebdo;

        this.state.social
            .coachData
            .hasLeftClub = true;

        this.state.social
            .coachData
            .previousClub =
            oldClub;

        this.state.pendingTransferOffer =
            null;

        StateManager.save(
            this.state
        );

        return {
            accepted: true,
            oldClub,
            newClub: offer.club,
            salary: offer.salaireHebdo
        };
    }

    rejectTransferOffer() {
        if (
            !this.state?.pendingTransferOffer
        ) {
            return false;
        }

        this.state.pendingTransferOffer =
            null;

        StateManager.save(
            this.state
        );

        return true;
    }

    retireCareer() {
        if (!this.state?.player) {
            return null;
        }

        const player =
            this.state.player;

        if (player.age < 34) {
            return {
                retired: false,
                reason:
                    'Retraite disponible à partir de 34 ans.'
            };
        }

        player.retired = true;
        player.careerEnded = true;

        StateManager.save(
            this.state
        );

        return {
            retired: true,
            age: player.age,
            overall: player.overall,
            potential: player.potential
        };
    }

    archiveAndResetSeason() {
        const player =
            this.state.player;

        const currentYear =
            this.state.calendar
                .currentSeasonYear;

        this.state.career
            .seasonHistory ||= [];

        this.state.career
            .seasonHistory.push({
                seasonLabel:
                    `${currentYear}/${currentYear + 1}`,

                club:
                    player.club,

                overall:
                    player.overall,

                age:
                    player.age,

                matches:
                    player.stats
                        ?.matchesPlayed ||
                    0,

                goals:
                    player.stats?.goals ||
                    0,

                assists:
                    player.stats?.assists ||
                    0,

                averageRating:
                    player.stats
                        ?.averageRating ||
                    0
            });

        // Potentiel vivant :
        // une seule évaluation par saison.
        const potentialReport =
            PotentialSystem.finalizeSeason(
                player,
                {
                    seasonLabel:
                        `${currentYear}/${currentYear + 1}`,

                    overall:
                        player.overall,

                    matches:
                        player.stats
                            ?.matchesPlayed ||
                        0,

                    goals:
                        player.stats?.goals ||
                        0,

                    assists:
                        player.stats?.assists ||
                        0,

                    averageRating:
                        player.stats
                            ?.averageRating ||
                        0
                }
            );

        // Progression et vieillissement.
        PlayerLogic.applyProgression(
            player,
            {
                xp: 0,
                type: 'finSaison',
                vieillirDUnAn: false
            }
        );

        PotentialSystem.advanceAge(
            player
        );

        // Passage senior à 18 ans.
        if (
            Number(player.age) >= 18 &&
            player.isYouthPlayer
        ) {
            player.isYouthPlayer =
                false;

            WorldSystem.normalizeCareerClub(
                player
            );
        }

        CareerSystem.refreshStage(
            player
        );

        PlayerLogic.syncProgressionFromCanonical(
            player
        );

        player.canRetire =
            player.age >= 34;

        player.careerEnded =
            player.age >= 42;

        this.state.career
            .lastPotentialReport =
            potentialReport;

        // Réinitialisation des statistiques saisonnières.
        player.stats.matchesPlayed = 0;
        player.stats.goals = 0;
        player.stats.assists = 0;
        player.stats.successfulPasses = 0;
        player.stats.tackles = 0;
        player.stats.yellowCards = 0;
        player.stats.averageRating = 0;

        player.fitness =
            Math.min(
                100,
                (player.fitness || 60) + 20
            );

        player.isInjured =
            false;

        player.injuryDuration =
            0;

        if (
            this.state.social?.coachData &&
            player.club !==
                this.state.social.youthClubName
        ) {
            this.state.social
                .coachData
                .hasLeftClub = true;
        }
    }

    resetCareer() {
        StateManager.clear();

        this.state = null;

        this.ui.activeApp =
            'home';

        this.ui.currentStep =
            1;

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