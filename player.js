// player.js
import { ORIGINS as UI_ORIGINS } from './constants.js';
import {
    initialiserJoueur,
    calculerGeneral,
    appliquerProgression
} from './progression.js';

const ORIGIN_MAP = {
    CENTRE_FORMATION: 'CENTRE_FORMATION',
    CLUB_AMATEUR: 'AMATEUR_QUARTIER',
    FUTSAL: 'FUTSAL',
    STREET: 'STREET_CAGE',
    ATHLETE: 'ATHLETE_POLYVALENT',
    DEBUTANT_TARDIF: 'DEBUTANT_TARDIF',
    FILS_DE_PRO: 'FILS_DE_PRO'
};

const POSITION_MAP = {
    DC: 'DC',
    DD: 'LAT',
    DG: 'LAT',
    MC: 'MDEF',
    MOC: 'MOFF',
    AD: 'AIL',
    AG: 'AIL',
    BU: 'BU',
    GK: 'BU'
};

const clamp = (value, min = 0, max = 100) =>
    Math.min(max, Math.max(min, Number(value) || 0));

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeOrigin(originId) {
    return ORIGIN_MAP[originId] || 'CENTRE_FORMATION';
}

function normalizePoste(position) {
    return POSITION_MAP[position] || 'BU';
}

function syncCanonicalFromProgression(player) {
    const model = player.progression;
    if (!model) return;

    player.attributes = {
        vitesse: model.stats.vitesse,
        tir: model.stats.tir,
        passe: model.stats.passes,
        dribble: model.stats.dribble,
        defense: model.stats.defense,
        physique: model.stats.physique,
        mental: model.stats.tete
    };

    player.overall = model.general;
    player.potential = model.potentielMax;
    player.xp = model.xp;
    player.xpLevel = model.niveauXP;
    player.age = model.age;
}

function syncProgressionFromCanonical(player) {
    if (!player.progression) return;

    player.progression.age = player.age;

    const a = player.attributes || {};
    player.progression.stats.vitesse = clamp(a.vitesse, 1, 99);
    player.progression.stats.tir = clamp(a.tir, 1, 99);
    player.progression.stats.passes = clamp(a.passe, 1, 99);
    player.progression.stats.dribble = clamp(a.dribble, 1, 99);
    player.progression.stats.defense = clamp(a.defense, 1, 99);
    player.progression.stats.physique = clamp(a.physique, 1, 99);
    player.progression.stats.tete = clamp(a.mental, 1, 99);
    player.progression.general = calculerGeneral(
        player.progression.stats,
        player.progression.poste
    );
    player.overall = player.progression.general;
}

export const PlayerLogic = {
    generateRandomName() {
        const firstNames = ['Lucas', 'Hugo', 'Enzo', 'Kylian', 'Theo', 'Rayan', 'Diego', 'Mateo'];
        const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Silva', 'Gomez'];
        const pick = array => array[Math.floor(Math.random() * array.length)];
        return `${pick(firstNames)} ${pick(lastNames)}`;
    },

    randomInt,

    createPlayerProfile(formData = {}) {
        const originId = formData.originId || formData.origin || 'CENTRE_FORMATION';
        const progressionOrigin = normalizeOrigin(originId);
        const position = formData.position || 'BU';
        const progressionPoste = normalizePoste(position);
        const age = Number(formData.age) || 16;

        let progressionPlayer;
        try {
            progressionPlayer = initialiserJoueur(
                progressionOrigin,
                progressionPoste,
                age
            );
        } catch (error) {
            console.warn('Profil progression invalide, fallback centre/BU :', error);
            progressionPlayer = initialiserJoueur('CENTRE_FORMATION', 'BU', age);
        }

        const originData = UI_ORIGINS[originId] || UI_ORIGINS.CENTRE_FORMATION;

        const player = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            firstname: formData.firstname || formData.firstName || 'Joueur',
            lastname: formData.lastname || formData.lastName || 'Inconnu',
            nationality: formData.nationality || formData.country || 'France',
            country: formData.country || formData.nationality || 'France',
            position,
            age,
            height: Number(formData.height) || 178,
            weight: Number(formData.weight) || 72,
            origin: originId,
            originLabel: originData?.name || progressionPlayer.origine,
            trait: originData?.trait || progressionPlayer.origine,
            heartClub: formData.heartClub || null,

            overall: progressionPlayer.general,
            potential: progressionPlayer.potentielMax,
            attributes: {},
            progression: progressionPlayer,

            xp: 0,
            xpLevel: 1,

            fame: originId === 'FILS_DE_PRO' ? 20 : 10,
            morale: 80,
            fitness: 90,
            isInjured: false,
            injuryDuration: 0,

            // Statistiques sociales / comportementales.
            stats: {
                technique: progressionPlayer.stats.passes,
                physique: progressionPlayer.stats.physique,
                mental: progressionPlayer.stats.tete,
                charisme: originId === 'FILS_DE_PRO' ? 55 : 50,
                reputation: originId === 'FILS_DE_PRO' ? 20 : 10,
                discipline: 50,
                relationCoach: 50,
                vestiaire: 50,

                matchesPlayed: 0,
                goals: 0,
                assists: 0,
                successfulPasses: 0,
                tackles: 0,
                yellowCards: 0,
                averageRating: 0
            },

            hidden: {
                consistency: randomInt(8, 16),
                bigMatchPlayer: randomInt(8, 16),
                injuryProneness: randomInt(4, 12)
            },

            salary: 0,
            club: null
        };

        syncCanonicalFromProgression(player);
        return player;
    },

    applyProgression(player, gains = {}) {
        if (!player?.progression) return null;

        syncProgressionFromCanonical(player);

        // L'objet progression reste la source de vérité pour XP/plafonds.
        const result = appliquerProgression(player.progression, gains);

        syncCanonicalFromProgression(player);
        return result;
    },

    syncProgressionFromCanonical,
    syncCanonicalFromProgression
};
