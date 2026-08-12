// Adversaire direct persistant pendant un match jouable.
// Ce module ne connaît pas l'UI et n'expose aucun bonus caché.

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

function stableIndex(seed, size) {
    const text = String(seed || 'direct-opponent');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return size ? (hash >>> 0) % size : 0;
}

function group(position = '') {
    const value = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(value)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'RB', 'DG', 'LB', 'D'].includes(value)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M', 'MDC', 'CDM'].includes(value)) return 'midfielder';
    if (['AD', 'RW', 'AG', 'LW'].includes(value)) return 'winger';
    return 'attacker';
}

const ARCHETYPES = Object.freeze({
    attacker: [
        { id:'physical-centre-back', role:'défenseur central', style:'physical', intro:'Il cherche le contact avant même que tu puisses te retourner.', tell:'Il veut t’empêcher de recevoir face au but.' },
        { id:'patient-centre-back', role:'défenseur central', style:'patient', intro:'Il ne se jette presque jamais et garde toujours un demi-mètre de sécurité.', tell:'Il attend surtout ton premier contrôle.' },
        { id:'fast-centre-back', role:'défenseur central', style:'fast', intro:'Il accepte de défendre un peu plus haut parce qu’il fait confiance à sa vitesse.', tell:'L’espace dans son dos existe, mais il faudra partir juste.' }
    ],
    winger: [
        { id:'aggressive-fullback', role:'latéral', style:'aggressive', intro:'Il vient te toucher dès ta première prise de balle et veut te faire jouer dos à la ligne.', tell:'Chaque duel devient personnel un peu plus vite que prévu.' },
        { id:'inside-fullback', role:'latéral', style:'inside', intro:'Il ferme l’intérieur et te laisse volontairement quelques mètres vers la ligne.', tell:'Il essaie de choisir à ta place la direction de ton prochain geste.' },
        { id:'patient-fullback', role:'latéral', style:'patient', intro:'Il recule au lieu de se jeter et garde les yeux sur tes hanches.', tell:'Il préfère perdre un mètre que perdre complètement le duel.' }
    ],
    midfielder: [
        { id:'shadow-midfielder', role:'milieu défensif', style:'shadow', intro:'Il te suit jusque dans tes décrochages et coupe d’abord la passe vers l’avant.', tell:'Pour le sortir de sa zone, il faudra l’attirer ailleurs.' },
        { id:'press-midfielder', role:'milieu', style:'aggressive', intro:'Il arrive dans ton dos dès que la passe part vers toi.', tell:'Ton premier contrôle sera presque toujours sous pression.' },
        { id:'reader-midfielder', role:'milieu', style:'patient', intro:'Il parle beaucoup et replace les autres avant de venir sur toi.', tell:'Il défend autant avec sa lecture qu’avec ses jambes.' }
    ],
    defender: [
        { id:'fast-winger', role:'ailier', style:'fast', intro:'Son premier appel est déjà une menace dans ton dos.', tell:'Il veut t’obliger à défendre en courant vers ton propre but.' },
        { id:'dribbler-winger', role:'ailier', style:'aggressive', intro:'Il demande le ballon très tôt et cherche immédiatement le un-contre-un.', tell:'Il veut savoir dès les premières minutes si tu vas reculer.' },
        { id:'inside-forward', role:'attaquant excentré', style:'inside', intro:'Il part de la ligne mais ses premiers déplacements sont presque tous vers l’intérieur.', tell:'Ton choix sera souvent entre suivre l’homme ou protéger la zone.' }
    ],
    goalkeeper: [
        { id:'pressing-forward', role:'avant-centre', style:'aggressive', intro:'Il lance le pressing dès que le ballon revient vers toi.', tell:'Il cherche surtout à provoquer une relance précipitée.' },
        { id:'run-forward', role:'avant-centre', style:'fast', intro:'Il reste sur l’épaule du dernier défenseur et surveille chaque ballon joué dans la profondeur.', tell:'Tu devras décider tôt quand sortir de ta surface.' }
    ]
});

export function createDirectOpponent({ seed, playerPosition, strength = 50 } = {}) {
    const playerGroup = group(playerPosition);
    const pool = ARCHETYPES[playerGroup] || ARCHETYPES.attacker;
    const archetype = pool[stableIndex(`${seed}:${playerGroup}:${strength}`, pool.length)];
    return {
        id: `${archetype.id}:${stableIndex(seed, 997)}`,
        role: archetype.role,
        style: archetype.style,
        intro: archetype.intro,
        tell: archetype.tell,
        pressure: clamp((Number(strength) - 50) / 20, -1, 1),
        playerDuelsWon: 0,
        opponentDuelsWon: 0,
        lastOutcome: null,
        rememberedChoices: []
    };
}

export function updateDirectOpponent(opponent, { success = null, duel = false, choice = '' } = {}) {
    if (!opponent) return opponent;
    const next = { ...opponent, rememberedChoices: [...(opponent.rememberedChoices || [])] };
    if (choice) {
        next.rememberedChoices.push(String(choice));
        if (next.rememberedChoices.length > 4) next.rememberedChoices.shift();
    }
    if (duel || /duel|éliminer|provoquer|petit pont|déborder|dribb/i.test(String(choice))) {
        if (success === true) next.playerDuelsWon += 1;
        if (success === false) next.opponentDuelsWon += 1;
    }
    next.lastOutcome = success === null ? next.lastOutcome : success ? 'player' : 'opponent';
    next.pressure = clamp(next.pressure + (success === true ? .18 : success === false ? -.14 : 0), -1, 1.4);
    return next;
}

export function directOpponentBeat(opponent, { minute = 0, index = 0, playerPosition = '' } = {}) {
    if (!opponent) return null;
    const won = Number(opponent.playerDuelsWon) || 0;
    const lost = Number(opponent.opponentDuelsWon) || 0;
    const role = opponent.role || 'vis-à-vis';
    const positionGroup = group(playerPosition);

    if (index === 0) {
        if (positionGroup === 'attacker') return `Depuis le début, le ${role} te suit de près. ${opponent.intro} ${opponent.tell}`;
        if (positionGroup === 'winger') return `Ton duel commence à se dessiner. Le ${role} en face de toi a déjà montré son plan : ${opponent.intro.toLowerCase()} ${opponent.tell}`;
        if (positionGroup === 'midfielder') return `À chaque décrochage, le ${role} vérifie où tu es avant de regarder le ballon. ${opponent.tell}`;
        if (positionGroup === 'defender') return `Ton adversaire direct cherche déjà à tester ta ligne. ${opponent.intro} ${opponent.tell}`;
        return `L’attaquant en face observe chacune de tes relances. ${opponent.tell}`;
    }

    if (won >= 2 && won > lost) return `À la ${Number(minute) || 0}e, ton vis-à-vis ne défend plus comme au début. Après plusieurs duels perdus, il recule d’un pas avant même que tu contrôles.`;
    if (lost >= 2 && lost > won) return `À la ${Number(minute) || 0}e, ton adversaire direct vient encore plus près. Il a gagné les derniers duels et veut t’empêcher de reprendre confiance.`;
    if (opponent.lastOutcome === 'player') return `Ton dernier duel a laissé une trace : cette fois, ton vis-à-vis protège d’abord l’espace dans son dos.`;
    if (opponent.lastOutcome === 'opponent') return `Ton vis-à-vis a lu ton dernier geste. Sur le ballon suivant, il te montre volontairement la même ouverture pour voir si tu vas recommencer.`;
    return `Le duel avec ton vis-à-vis reste indécis. Aucun de vous deux n’a encore réussi à imposer complètement sa manière de jouer.`;
}

export function directOpponentChoiceSet({ playerPosition = '', minute = 0 } = {}) {
    const positionGroup = group(playerPosition);
    if (positionGroup === 'attacker') return [
        { text:'Prendre l’appel dans son dos', impacts:{ratingBonus:.08,goalChance:.075,fatigueRisk:2,duelBonus:.05} },
        { text:'Décrocher pour l’attirer puis repartir', impacts:{ratingBonus:.1,assistChance:.055,goalChance:.035,fatigueRisk:2} },
        { text:'Venir au contact, protéger puis remettre', impacts:{ratingBonus:.08,passAccuracy:.08,duelBonus:.055,fatigueRisk:1} },
        { text:'Demander le ballon dans les pieds et provoquer', impacts:{ratingBonus:.1,goalChance:.05,duelBonus:.09,technicalRisk:.08,fatigueRisk:2} }
    ];
    if (positionGroup === 'winger') return [
        { text:'Attaquer la ligne dès le contrôle', impacts:{ratingBonus:.08,assistChance:.06,duelBonus:.08,fatigueRisk:2,technicalRisk:.07} },
        { text:'Rentrer intérieur pour l’obliger à tourner', impacts:{ratingBonus:.1,goalChance:.06,assistChance:.035,duelBonus:.06,technicalRisk:.07} },
        { text:'Jouer en une touche puis repartir dans son dos', impacts:{ratingBonus:.1,passAccuracy:.08,assistChance:.045,fatigueRisk:2} },
        { text:'Fixer sans toucher le ballon et libérer le couloir au latéral', impacts:{ratingBonus:.08,assistChance:.05,fatigueRisk:0} }
    ];
    if (positionGroup === 'midfielder') return [
        { text:'Se retourner dès le contrôle', impacts:{ratingBonus:.09,assistChance:.06,technicalRisk:.08} },
        { text:'Jouer en une touche derrière sa course', impacts:{ratingBonus:.1,passAccuracy:.09,assistChance:.05} },
        { text:'Conduire pour l’attirer avant de lâcher le ballon', impacts:{ratingBonus:.08,assistChance:.055,duelBonus:.04,fatigueRisk:1} },
        { text:'Décrocher plus bas pour l’emmener hors de sa zone', impacts:{ratingBonus:.07,passAccuracy:.07,fatigueRisk:-1} }
    ];
    if (positionGroup === 'defender') return [
        { text:'Sortir fort sur son premier contrôle', impacts:{ratingBonus:.1,duelBonus:.1,cardRisk:.05,fatigueRisk:1} },
        { text:'Temporiser et l’emmener vers la ligne', impacts:{ratingBonus:.09,duelBonus:.065,opponentThreat:-.05} },
        { text:'Couper la passe avant qu’elle n’arrive', impacts:{ratingBonus:.12,duelBonus:.08,technicalRisk:.08,opponentThreat:-.07} },
        { text:'Rester dans la zone et laisser le milieu revenir', impacts:{ratingBonus:.07,opponentThreat:-.04,fatigueRisk:-1} }
    ];
    return [
        { text:'Fixer l’attaquant et jouer court', impacts:{ratingBonus:.09,passAccuracy:.09,technicalRisk:.05} },
        { text:'Allonger derrière le pressing', impacts:{ratingBonus:.08,assistChance:.025,technicalRisk:.08} },
        { text:'Attendre une demi-seconde pour ouvrir un angle', impacts:{ratingBonus:.07,passAccuracy:.06,technicalRisk:.06} },
        { text:'Jouer immédiatement sur le côté', impacts:{ratingBonus:.065,passAccuracy:.08} }
    ];
}

export default { createDirectOpponent, updateDirectOpponent, directOpponentBeat, directOpponentChoiceSet };
