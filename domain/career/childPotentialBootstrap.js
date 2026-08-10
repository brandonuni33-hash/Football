// domain/career/childPotentialBootstrap.js
// Crée le profil sportif du fils sans hériter du potentiel du parent.
// Le moteur de potentiel reste l'unique propriétaire de la progression sportive.

import { PotentialSystem } from '../../potentialSystem.js';

export class ChildPotentialBootstrap {
    create({ player, profile = {} } = {}) {
        if (!player) return null;

        // Ne jamais transmettre profile.potential, parentPotential ou une valeur
        // calculée depuis le parent. L'absence de base force un tirage indépendant.
        const potentialProfile = PotentialSystem.createProfile();
        const startingPotential = potentialProfile.current;

        player.age = 14;
        player.potentialProfile = potentialProfile;
        player.potential = startingPotential;
        player.overall = Number.isFinite(Number(profile.overall))
            ? Number(profile.overall)
            : Math.min(40, startingPotential);

        player.generationIdentity ||= {};
        player.generationIdentity.sportingOrigin = 'independent';
        player.generationIdentity.parentPotentialInherited = false;
        player.generationIdentity.parentOverallInherited = false;
        player.generationIdentity.potentialSeed = null;

        return {
            potentialProfile,
            potential: startingPotential,
            overall: player.overall,
            independent: true
        };
    }
}

export default ChildPotentialBootstrap;
