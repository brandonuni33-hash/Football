// domain/match/matchChoiceManager.js

function group(position='BU') {
    const p=String(position||'').toUpperCase();
    if(['GK','GB','G'].includes(p))return'goalkeeper';
    if(['DC','CB','DD','RB','DG','LB','D'].includes(p))return'defender';
    if(['MC','CM','MOC','CAM','MD','MG','M'].includes(p))return'midfielder';
    return'attacker';
}
function pick(pool){return pool[Math.floor(Math.random()*pool.length)];}
const roleDilemmas={
    goalkeeper:[
        {title:'🧤 Votre surface devient le centre du match',description:"L’adversaire multiplie les centres et cherche à vous enfermer sur votre ligne.",choices:[
            {text:'Sortir plus tôt pour couper les centres',impacts:{stats:{mental:2},matchBonuses:{duelBonus:.1,ratingBonus:.08,cardRisk:.02}}},
            {text:'Rester patient et privilégier la lecture de trajectoire',impacts:{stats:{mental:2,technique:1},matchBonuses:{ratingBonus:.1,fatigueRisk:-1}}},
            {text:'Relancer vite dès chaque ballon capté',impacts:{stats:{technique:1},matchBonuses:{counterAttack:.12,passAccuracy:.08}}}
        ]},
        {title:'🧤 Le match vous demande une relance propre',description:"Le pressing adverse vient jusque dans votre surface. Chaque première passe peut libérer ou enfermer l’équipe.",choices:[
            {text:'Jouer court malgré le pressing',impacts:{matchBonuses:{passAccuracy:.12,ratingBonus:.08,technicalRisk:.06}}},
            {text:'Chercher directement le joueur libre plus haut',impacts:{matchBonuses:{counterAttack:.1,ratingBonus:.04}}}
        ]}
    ],
    defender:[
        {title:'🛡️ L’attaquant cherche votre dos',description:"Votre vis-à-vis multiplie les appels entre vous et le latéral. Votre placement devient décisif.",choices:[
            {text:'Anticiper et défendre un mètre plus bas',impacts:{stats:{defense:2,mental:1},matchBonuses:{duelBonus:.08,ratingBonus:.1}}},
            {text:'Monter fort pour couper la passe avant l’appel',impacts:{stats:{defense:2},matchBonuses:{duelBonus:.12,cardRisk:.06}}},
            {text:'Guider l’attaquant vers l’extérieur',impacts:{stats:{mental:2},matchBonuses:{ratingBonus:.08,opponentThreat:-.05}}}
        ]},
        {title:'📐 Une relance à construire sous pression',description:"Le premier rideau adverse ferme l’axe et vous laisse quelques secondes pour choisir la sortie.",choices:[
            {text:'Casser une ligne par une passe verticale',impacts:{stats:{technique:1,mental:1},matchBonuses:{passAccuracy:.08,assistChance:.03,technicalRisk:.05}}},
            {text:'Renverser vers le côté faible',impacts:{matchBonuses:{passAccuracy:.1,ratingBonus:.08}}},
            {text:'Sécuriser et faire repartir le bloc',impacts:{matchBonuses:{ratingBonus:.06,fatigueRisk:-1}}}
        ]}
    ],
    midfielder:[
        {title:'🎯 L’espace existe entre les lignes',description:"Le milieu adverse hésite entre vous suivre et protéger sa défense. Vous pouvez exploiter cette indécision.",choices:[
            {text:'Recevoir entre les lignes et jouer vers l’avant',impacts:{stats:{technique:2,mental:1},matchBonuses:{assistChance:.08,ratingBonus:.1}}},
            {text:'Décrocher pour attirer un adversaire et libérer un partenaire',impacts:{stats:{mental:2},matchBonuses:{teamBoost:.08,passAccuracy:.1}}},
            {text:'Porter le ballon pour fixer avant de donner',impacts:{stats:{technique:1},matchBonuses:{duelBonus:.06,assistChance:.05,fatigueRisk:2}}}
        ]},
        {title:'🧠 Le tempo du match change',description:"Votre équipe commence à perdre le contrôle du ballon. Le prochain choix peut calmer ou accélérer la rencontre.",choices:[
            {text:'Faire respirer le jeu avec deux passes simples',impacts:{matchBonuses:{passAccuracy:.12,ratingBonus:.07,fatigueRisk:-1}}},
            {text:'Accélérer dès la prochaine récupération',impacts:{matchBonuses:{counterAttack:.12,assistChance:.05,fatigueRisk:2}}}
        ]}
    ],
    attacker:[
        {title:'⚡ La défense laisse un intervalle',description:"Un défenseur regarde le ballon une seconde de trop. Votre appel peut transformer cette hésitation en occasion.",choices:[
            {text:'Attaquer immédiatement l’espace dans son dos',impacts:{stats:{vitesse:2},matchBonuses:{goalChance:.09,fatigueRisk:2}}},
            {text:'Décrocher pour l’attirer puis repartir dans la profondeur',impacts:{stats:{mental:2,technique:1},matchBonuses:{goalChance:.06,assistChance:.04}}},
            {text:'Rester caché au second poteau et attendre le centre',impacts:{stats:{mental:2},matchBonuses:{goalChance:.08,ratingBonus:.06}}}
        ]},
        {title:'🎯 Vous recevez dos au but',description:"Le défenseur est collé à vous. Le ballon arrive avec peu d’espace et une décision immédiate à prendre.",choices:[
            {text:'Remiser en une touche et repartir dans la surface',impacts:{matchBonuses:{passAccuracy:.1,goalChance:.06}}},
            {text:'Se retourner pour provoquer le défenseur',impacts:{matchBonuses:{duelBonus:.1,goalChance:.07,technicalRisk:.08}}},
            {text:'Protéger le ballon et attendre le soutien',impacts:{matchBonuses:{teamBoost:.07,ratingBonus:.08}}}
        ]}
    ]
};

export class MatchChoiceManager {
    static shouldTriggerDilemma(matchType){if(matchType==='final'||matchType==='rival')return true;return Math.random()<.35;}
    static getMatchDilemma(matchType,opponentName,position='BU'){
        if(matchType==='final')return{type:'final',title:'🏆 Finale contre '+opponentName,description:"Le match a basculé dans une zone où chaque décision compte davantage. Comment voulez-vous imposer votre rôle ?",choices:[
            {text:'Jouer avec davantage d’audace',impacts:{stats:{mental:2},matchBonuses:{ratingBonus:.12,goalChance:.05,assistChance:.04,fatigueRisk:3}}},
            {text:'Rester fidèle à votre rôle et ne rien forcer',impacts:{stats:{discipline:2,mental:1},matchBonuses:{ratingBonus:.1,passAccuracy:.08}}},
            {text:'Prendre plus de responsabilités dans les moments chauds',impacts:{stats:{charisme:2},matchBonuses:{teamBoost:.08,ratingBonus:.1}}}
        ]};
        if(matchType==='rival')return{type:'rival',title:'🔥 Le derby contre '+opponentName,description:"Les duels montent en intensité et le public réagit à chaque contact. Il faut choisir votre manière d’entrer dans ce rapport de force.",choices:[
            {text:'Répondre par l’intensité sans sortir du match',impacts:{stats:{physique:1,mental:1},matchBonuses:{duelBonus:.1,cardRisk:.04}}},
            {text:'Refuser les provocations et jouer plus vite',impacts:{stats:{mental:2,technique:1},matchBonuses:{passAccuracy:.1,ratingBonus:.1}}},
            {text:'Chercher à faire mal uniquement avec le ballon',impacts:{stats:{technique:2},matchBonuses:{goalChance:.04,assistChance:.05,technicalRisk:.04}}}
        ]};
        return pick(roleDilemmas[group(position)]||roleDilemmas.attacker);
    }
}
export default MatchChoiceManager;
