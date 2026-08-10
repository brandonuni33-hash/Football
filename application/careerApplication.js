// application/careerApplication.js
// Orchestration applicative de création et de restauration d'une carrière.

export class CareerApplication {
    constructor({
        stateManager,
        playerLogic,
        economyManager,
        socialSystem,
        mediaSystem,
        consequenceSystem,
        potentialSystem,
        careerSystem,
        competitionSystem,
        worldSystem,
        cupSystem,
        schemaVersion
    } = {}) {
        Object.assign(this, {
            stateManager,
            playerLogic,
            economyManager,
            socialSystem,
            mediaSystem,
            consequenceSystem,
            potentialSystem,
            careerSystem,
            competitionSystem,
            worldSystem,
            cupSystem,
            schemaVersion
        });
    }

    create(selectedData = {}) {
        const player = this.playerLogic.createPlayerProfile({
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
        const contract = this.economyManager.calculateContractOffer(youthClub, player);

        player.club = youthClubName;
        player.clubCountry = youthClub?.country || player.clubCountry || player.country || 'France';
        player.clubLevel = Number(youthClub?.tier) || player.clubLevel || 1;
        player.youthClubName = youthClubName;
        player.youthClubData = youthClub ? { ...youthClub } : null;
        player.isYouthPlayer = Number(player.age) < 18;

        if (!player.isYouthPlayer) this.worldSystem.normalizeCareerClub(player);

        this.careerSystem.initialize(
            player,
            youthClub || (player.clubId ? this.worldSystem.getClub(player.clubId) : null)
        );

        player.contract = { ...player.contract, ...contract };
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

        const state = {
            schemaVersion: this.schemaVersion,
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
                currentPeriod: 'Pré-saison & reprise',
                totalMonths: 12,
                seasonSchedule: null,
                seasonMatchCursor: 0
            },
            seasonPhase: 'pre_season',
            pendingEvent: null,
            pendingCoachEvent: null,
            pendingMediaDilemma: null,
            pendingTransferOffer: null,
            pendingPositionProposal: null,
            world: { version: 1, leagues: {}, lastSeasonFinalized: null },
            cups: {},
            cupHistory: [],
            careerStructure: player.careerProfile || null
        };

        this.socialSystem.ensureRelationships(state);
        this.consequenceSystem.initialize(state.player);
        this.potentialSystem.ensure(state.player);
        this.careerSystem.refreshStage(state.player);
        this.worldSystem.ensureWorld(state);
        this.cupSystem.ensure(state);
        state.careerStructure = state.player.careerProfile || null;
        this.stateManager.save(state);

        return state;
    }

    migrate(state) {
        if (!state?.player) return state;
        const player = state.player;

        if (!player.progression) {
            const migrated = this.playerLogic.createPlayerProfile({
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
            migrated.stats = { ...migrated.stats, ...(player.stats || {}) };
            migrated.hidden = { ...migrated.hidden, ...(player.hidden || {}) };
            this.playerLogic.syncProgressionFromCanonical(migrated);
            state.player = migrated;
        }

        if (!state.player.careerProfile) {
            this.careerSystem.initialize(state.player, {
                name: state.player.club || 'Centre de Formation',
                prestige: 40,
                country: state.player.clubCountry || state.player.country || 'France'
            });
        } else {
            this.careerSystem.refreshStage(state.player);
            this.worldSystem.ensureWorld(state);
        }

        state.careerStructure = state.player.careerProfile;
        state.trainingFocus ||= 'TECHNIQUE';
        state.career ||= { balance: 0, seasonHistory: [], totalCareerIncome: 0 };
        state.calendar ||= {
            currentMonth: 8,
            currentSeasonYear: 2026,
            currentPeriod: 'Pré-saison & reprise',
            seasonSchedule: null,
            seasonMatchCursor: 0
        };
        this.competitionSystem.ensureSeasonSchedule(state);
        this.cupSystem.ensure(state);
        state.social ||= this.socialSystem.initSocialData(state.player.coachName || 'l’entraîneur');
        state.media ||= this.mediaSystem.initMediaData();
        this.socialSystem.ensureRelationships(state);
        state.social.coachData ||= {
            name: state.player.coachName || 'l’entraîneur',
            relation: state.player.stats?.relationCoach ?? 50,
            opinion: 'Neutre',
            hasLeftClub: false
        };

        this.stateManager.save(state);
        return state;
    }
}

export default CareerApplication;
