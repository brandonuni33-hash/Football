// Street to Pro — 4e choix contextuel de match.
// Le choix supplémentaire vient d'un acquis réel : origine ou entraînement.
// IMPORTANT : la source reste cachée à l'UI. On affiche une action de football, jamais « Réflexe futsal ».

const norm=v=>String(v??'').trim().toUpperCase();
const arr=v=>Array.isArray(v)?v:[];
function hash(seed='fourth-choice'){let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const pick=(list,seed)=>list.length?list[hash(seed)%list.length]:null;

export function playerOriginId(player={}){
  return norm(player.origin?.id||player.origin||player.originId);
}

function learnedTokens(state={}){
  const p=state.player||{};
  const training=state.training||{};
  const values=[
    ...arr(p.learnedGestures),...arr(p.learnedSkills),...arr(p.trainingUnlocks),
    ...arr(training.learnedGestures),...arr(training.learnedSkills),...arr(training.unlocks),
    ...arr(state.learnedGestures),...arr(state.trainingUnlocks),
    state.trainingFocus,training.focus,training.currentFocus,p.trainingFocus
  ];
  return values.map(v=>norm(typeof v==='object'?(v.id||v.key||v.name):v)).filter(Boolean);
}

function hasToken(tokens,words=[]){return words.some(word=>tokens.some(token=>token.includes(norm(word))));}
function textOf(context={}){return norm(`${context.title||''} ${context.description||''} ${(context.choices||[]).map(c=>c.text||'').join(' ')}`);}

const ORIGIN_CHOICES={
  FUTSAL:[
    {key:'futsal-sole',when:/PETIT ESPACE|PRESSION|DOS AU BUT|ENCERCL|SURFACE|DUEL/,text:'Bloquer le ballon sous la semelle puis repartir de l’autre côté',gesture:'Semelle et sortie opposée',style:'technical',impacts:{ratingBonus:.2,duelBonus:.11,technicalRisk:.11}},
    {key:'futsal-toe',when:/FRAPP|BUT|GARDIEN|FINITION|ANGLE/,text:'Armer presque sans élan et piquer du bout du pied',gesture:'Pointu futsal',style:'technical',impacts:{ratingBonus:.2,goalChance:.11,technicalRisk:.14}},
    {key:'futsal-wall',when:/PASSE|REMISE|UNE-DEUX|PARTENAIRE|COÉQUIPIER/,text:'Jouer en une touche et replonger immédiatement dans l’espace',gesture:'Appui-remise instantané',style:'technical',impacts:{ratingBonus:.18,passAccuracy:.11,assistChance:.06,technicalRisk:.08}},
    {key:'futsal-feint',when:/.*/,text:'Attendre le dernier appui puis sortir par un changement de direction très court',gesture:'Changement d’appui court',style:'technical',impacts:{ratingBonus:.18,duelBonus:.1,technicalRisk:.12}}
  ],
  STREET:[
    {key:'street-nutmeg',when:/DUEL|DÉFENSEUR|LATÉRAL|VIS-À-VIS|MARQUAGE/,text:'L’attirer sur ton premier geste puis tenter le petit pont',gesture:'Petit pont',style:'spectacular',impacts:{ratingBonus:.22,duelBonus:.14,technicalRisk:.19}},
    {key:'street-body',when:/PETIT ESPACE|ENCERCL|PRESSION|AXE/,text:'Improviser une feinte de corps pour sortir là où personne ne t’attend',gesture:'Feinte instinctive',style:'technical',impacts:{ratingBonus:.2,duelBonus:.12,technicalRisk:.15}},
    {key:'street-no-look',when:/PASSE|CENTRE|PARTENAIRE|COÉQUIPIER|APPEL/,text:'Masquer complètement ton regard avant de servir l’appel',gesture:'Passe masquée',style:'spectacular',impacts:{ratingBonus:.21,assistChance:.08,passAccuracy:.08,technicalRisk:.14}},
    {key:'street-elastic',when:/.*/,text:'Provoquer encore et sortir un geste improvisé en un contre un',gesture:'Geste de rue',style:'spectacular',impacts:{ratingBonus:.21,duelBonus:.13,technicalRisk:.18}}
  ],
  ATHLETE:[
    {key:'athlete-burst',when:/ESPACE|PROFONDEUR|COURSE|TRANSITION|DERRIÈRE|ACCÉLÉR/,text:'Allonger la première touche et déclencher ton accélération maximale',gesture:'Explosivité pure',style:'physical',impacts:{ratingBonus:.18,duelBonus:.09,fatigueRisk:2,technicalRisk:.08}},
    {key:'athlete-contact',when:/CONTACT|PHYSIQUE|DOS AU BUT|MARQUAGE|DÉFENSEUR/,text:'Absorber le contact et continuer sur ta puissance',gesture:'Passage en puissance',style:'physical',impacts:{ratingBonus:.18,duelBonus:.13,fatigueRisk:2,technicalRisk:.09}},
    {key:'athlete-air',when:/CENTRE|AÉRIEN|TÊTE|RETOMBÉE/,text:'Attaquer la retombée plus haut et plus tôt que tout le monde',gesture:'Détente explosive',style:'physical',impacts:{ratingBonus:.19,goalChance:.06,duelBonus:.12,fatigueRisk:2,technicalRisk:.09}},
    {key:'athlete-carry',when:/.*/,text:'Porter le ballon plein axe en misant sur ta puissance de course',gesture:'Percussion athlétique',style:'physical',impacts:{ratingBonus:.16,duelBonus:.1,fatigueRisk:2,technicalRisk:.1}}
  ]
};

const TRAINING_CHOICES=[
  {key:'train-one-touch',tokens:['PASSE','PASS','VISION','COLLECTIF','JEU'],when:/PASSE|REMISE|PARTENAIRE|COÉQUIPIER|PRESSION|LIGNE/,text:'Appliquer la consigne travaillée : jouer en une touche avant que la ligne ne se referme',gesture:'Jeu en une touche',style:'trained',impacts:{ratingBonus:.18,passAccuracy:.13,assistChance:.05,technicalRisk:.07}},
  {key:'train-control',tokens:['TECHNIQUE','CONTROLE','CONTRÔLE','DRIBBLE'],when:/CONTRÔL|PRESSION|BALLON|REÇOIS|RECEPTION|RÉCEPTION/,text:'Reproduire le contrôle orienté travaillé à l’entraînement',gesture:'Contrôle orienté travaillé',style:'trained',impacts:{ratingBonus:.19,duelBonus:.07,technicalRisk:.08}},
  {key:'train-finish',tokens:['TIR','FINITION','SHOOT'],when:/FRAPP|BUT|GARDIEN|FINITION|SURFACE/,text:'Reprendre exactement la finition répétée à l’entraînement',gesture:'Finition répétée',style:'trained',impacts:{ratingBonus:.19,goalChance:.12,technicalRisk:.09}},
  {key:'train-cross',tokens:['CENTRE','CROSS','AILE'],when:/CENTRE|COULOIR|LATÉRAL|SECOND POTEAU|LIGNE DE BUT/,text:'Chercher la zone travaillée toute la semaine plutôt que centrer au hasard',gesture:'Centre travaillé',style:'trained',impacts:{ratingBonus:.18,assistChance:.09,passAccuracy:.11,technicalRisk:.08}},
  {key:'train-speed',tokens:['VITESSE','SPRINT','EXPLOS'],when:/COURSE|PROFONDEUR|ESPACE|TRANSITION|ACCÉLÉR/,text:'Déclencher sur le premier appui comme répété sur les exercices de vitesse',gesture:'Premier appui travaillé',style:'trained',impacts:{ratingBonus:.17,duelBonus:.07,fatigueRisk:1,technicalRisk:.07}},
  {key:'train-physical',tokens:['PHYSIQUE','PUISSANCE','FORCE'],when:/CONTACT|DUEL|DOS AU BUT|MARQUAGE|PROTÉG/,text:'Utiliser l’appui et la protection de balle travaillés à l’entraînement',gesture:'Protection travaillée',style:'trained',impacts:{ratingBonus:.17,duelBonus:.11,technicalRisk:.07}},
  {key:'train-mental',tokens:['MENTAL','CONCENTRATION','CALME'],when:/PRESSION|DERNIÈRE|DÉCIS|FIN DE MATCH|GARDIEN/,text:'Ralentir une demi-seconde et appliquer la routine de calme travaillée',gesture:'Routine de concentration',style:'trained',impacts:{ratingBonus:.16,technicalRisk:.05,teamBoost:.04}}
];

function originCandidate(state,context){
  const origin=playerOriginId(state.player);
  const pool=ORIGIN_CHOICES[origin]||[];
  const text=textOf(context);
  const contextual=pool.filter(item=>item.when.test(text));
  return pick(contextual.length?contextual:pool,`${context.seed}|${context.id}|origin|${origin}`);
}
function trainingCandidate(state,context){
  const tokens=learnedTokens(state);if(!tokens.length)return null;
  const text=textOf(context);
  const pool=TRAINING_CHOICES.filter(item=>hasToken(tokens,item.tokens)&&item.when.test(text));
  return pick(pool,`${context.seed}|${context.id}|training|${tokens.join(':')}`);
}

export function selectSpecialFourthChoice(state={},context={}){
  const origin=originCandidate(state,context);
  const trained=trainingCandidate(state,context);
  if(!origin&&!trained)return null;
  // Si les deux sources existent, on alterne de façon déterministe pour que l'entraînement ait une vraie place.
  const chosen=origin&&trained?(hash(`${context.seed}|${context.id}|source`)%2?trained:origin):(trained||origin);
  const source=chosen===trained?'training':'origin';
  return {...chosen,specialFourthChoice:true,unlockSource:source,unlockKey:chosen.key};
}

export function appendSpecialFourthChoice(baseChoices=[],state={},context={}){
  const choices=arr(baseChoices).map(item=>({...item}));
  if(choices.length!==3)return choices;
  const special=selectSpecialFourthChoice(state,{...context,choices});
  if(!special)return choices;
  if(choices.some(c=>norm(c.text)===norm(special.text)))return choices;
  return [...choices,special];
}

export const SpecialFourthChoiceSystem=Object.freeze({playerOriginId,selectSpecialFourthChoice,appendSpecialFourthChoice});
export default SpecialFourthChoiceSystem;
