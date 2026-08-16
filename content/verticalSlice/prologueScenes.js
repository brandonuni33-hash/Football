// content/verticalSlice/prologueScenes.js
// Données éditoriales isolées de la vertical slice.
// Aucun branchement vers le moteur de match, le Career Hub ou le Narrative runtime principal.

export const NARRATIVE_PANEL_CONTRACT = Object.freeze({
    panelCount: 3,
    navigation: 'HORIZONTAL_SWIPE',
    forwardGesture: 'LEFT',
    backGesture: 'RIGHT',
    topChrome: false,
    dialogueOnlyOnActivePanel: true
});

const line = (speaker, text) => Object.freeze({ speaker, text });

export const APARTMENT_SCENE = Object.freeze({
    id: 'apartment-before-city',
    location: 'Appartement',
    lines: Object.freeze([
        line('Maman', 'Je t’ai laissé à manger. Tu te serviras quand t’auras faim.'),
        line('Héros', 'Mmh.'),
        line('Maman', 'Et surtout, tu laisses pas tout traîner après.'),
        line('Héros', 'Oui.'),
        line('Maman', 'Tu comptes rester toute la soirée devant ça ?'),
        line('Héros', 'Nan, après je vais au city avec Kemi et Rudhi.'),
        line('Maman', 'Encore… Faites attention. Et rentre pas trop tard, demain t’as cours.'),
        line('Maman', 'Et ferme bien quand tu pars.'),
        line('Héros', 'Maman—'),
        line('Maman', 'Je suis en retard. On parle plus tard.'),
        line('Maman', 'À tout à l’heure.'),
        line('Kemi', 'Lâche la play un peu, viens on sort ?')
    ])
});

export const CITY_DIALOGUE_SCENE = Object.freeze({
    id: 'city-kemi-rudhi-before-3v3',
    location: 'City',
    lines: Object.freeze([
        line('Kemi', 'T’es bien long toi.'),
        line('Héros', 'Ferme-la.'),
        line('Kemi', 'Il veut jamais lâcher sa Play.'),
        line('Rudhi', 'Je suis même pas étonné.'),
        line('Héros', 'Vas-y toi.'),
        line('Rudhi', 'Tout ça pour perdre en plus.'),
        line('Kemi', 'On joue alors ?'),
        line('Héros', 'Contre qui ?'),
        line('Kemi', 'Eux. Ils parlent depuis tout à l’heure.'),
        line('Rudhi', 'C’est surtout toi qui parles depuis tout à l’heure.'),
        line('Kemi', 'T’es avec nous ou t’es avec eux ?'),
        line('Rudhi', 'Je préfère même pas répondre.')
    ]),
    next: 'city-3v3'
});

export const VERTICAL_SLICE_PROLOGUE_SCENES = Object.freeze([
    APARTMENT_SCENE,
    CITY_DIALOGUE_SCENE
]);
