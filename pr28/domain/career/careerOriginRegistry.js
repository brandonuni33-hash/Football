// domain/career/careerOriginRegistry.js
// Source unique des origines disponibles à la création d'une première carrière.
// L'héritage familial professionnel n'est volontairement PAS une origine de création.

export const CAREER_ORIGINS = Object.freeze([
    { id: 'local_club', label: 'Club local', generation: 1 },
    { id: 'academy', label: 'Centre de formation', generation: 1 },
    { id: 'street', label: 'Football de quartier', generation: 1 },
    { id: 'school', label: 'Football scolaire', generation: 1 }
]);

export const REMOVED_ORIGINS = Object.freeze([
    'pro_player_son',
    'fils_de_joueur_pro',
    'professional_player_child'
]);

export function getCareerCreationOrigins() {
    return CAREER_ORIGINS.filter(origin => !REMOVED_ORIGINS.includes(origin.id));
}

export function isSecondGenerationOrigin(originId) {
    return originId === 'second_generation';
}
