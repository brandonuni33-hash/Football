// Street to Pro — présentation progressive des matchs jeunes.
// Cette couche ne modifie ni les effets mécaniques ni les faits canoniques.
// Elle réduit seulement la complexité affichée selon l'âge et donne aux choix
// une forme plus immédiate, plus vivante et plus lisible sur mobile.

const n=value=>Number.isFinite(Number(value))?Number(value):0;
function contextText(session={}){return[session.competition,session.match?.competitionName,session.match?.competition,session.match?.ageCategory,session.match?.category,session.match?.level].filter(Boolean).join(' ').toLowerCase();}
export function youthMatchTier(state={},session={}){
 const age=n(state.player?.age??session.playerAge??session.match?.playerAge??session.match?.age),text=contextText(session);
 if((age&&age<=15)||/u\s?15|moins de 15/.test(text))return'u15';
 if((age&&age<=18)||/u\s?1[678]|youth|formation|academy|académie|jeune/.test(text))return'youth';
 return null;
}
function role(position=''){const p=String(position||'').toUpperCase();if(['GK','GB','G'].includes(p))return'goalkeeper';if(['DC','CB','DD','RB','DG','LB','D'].includes(p))return'defender';if(['MC','CM','MOC','CAM','MDC','CDM','MD','MG','M'].includes(p))return'midfielder';if(['AG','AD','LW','RW'].includes(p))return'winger';return'attacker';}
function hash(seed=''){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function pick(seed,items=[]){return items.length?items[hash(seed)%items.length]:'';}
function seed(session={},step={},key='youth'){return`${session.match?.id||session.id}:${step.minute||0}:${session.currentMoment||0}:${key}`;}

const U15_SCENES={
 goalkeeper:[['Le ballon arrive dans ta zone','Un adversaire se rapproche. Tu dois décider vite quoi faire du ballon.'],['À toi de relancer','Tu récupères le ballon. Tes partenaires s’écartent pour t’offrir des solutions.']],
 defender:[['Il vient vers toi','L’attaquant avance avec le ballon. Tu dois choisir quand intervenir.'],['Un ballon à défendre','Ton adversaire reçoit près de toi. Il essaie de se retourner.']],
 midfielder:[['Sous pression','Tu reçois au milieu avec un adversaire qui arrive sur toi.'],['Le ballon est pour toi','Tu as le ballon et une seconde pour choisir la suite.']],
 winger:[['Face à ton défenseur','Tu reçois près de la ligne. Ton défenseur vient à ta rencontre.'],['Un contre un','Le ballon arrive dans tes pieds. Il y a de la place devant toi.']],
 attacker:[['Dos au défenseur','Tu reçois avec un défenseur collé à toi. Un partenaire part devant.'],['Un ballon à jouer','Tu reçois près de la surface. Le défenseur ne te laisse pas beaucoup d’espace.']]
};
const YOUTH_SCENES={
 goalkeeper:[['Relance sous pression','Tu récupères le ballon pendant que l’attaquant vient fermer une première solution.'],['Le jeu repart de toi','Tes partenaires s’écartent. Tu dois choisir rapidement où relancer.']],
 defender:[['Duel à défendre','L’attaquant reçoit près de ta zone et cherche à se mettre face au jeu.'],['Il faut choisir','Ton adversaire accélère vers toi. Tu peux intervenir ou l’accompagner.']],
 midfielder:[['Pressé au milieu','Tu reçois avec un adversaire dans ton dos et une solution proche.'],['Une solution s’ouvre','Tu contrôles au milieu. Un partenaire se rend disponible devant toi.']],
 winger:[['Ton duel sur le côté','Tu reçois près de la ligne avec ton latéral face à toi.'],['De l’espace devant toi','Le ballon arrive côté ligne et ton défenseur recule légèrement.']],
 attacker:[['Dos au but','Tu reçois avec un défenseur proche et un partenaire qui démarre autour de toi.'],['La défense recule','Tu reçois près de la surface avec peu de temps avant le retour du défenseur.']]
};

function choiceMeta(choice={}){
 const text=String(choice.text||choice.texte||choice.label||'Choisir'),lower=text.toLowerCase();
 if(/frapp|tir|but|finition|volée|panenka/.test(lower))return{icon:'🎯',tone:'attack',displayLabel:text.replace(/^Tenter de /i,'').replace(/^Essayer de /i,''),hint:'Chercher le but'};
 if(/appel|dos|profondeur|accél|déborder|ligne/.test(lower))return{icon:'⚡',tone:'attack',displayLabel:/appel.*dos/i.test(lower)?'Partir dans son dos':text.replace(/^Prendre /i,'').replace(/^Attaquer /i,''),hint:/dos|profondeur/.test(lower)?'Le prendre de vitesse':'Accélérer'};
 if(/protéger|contact|garder|temporiser|sécur|revenir/.test(lower))return{icon:'🛡️',tone:'safe',displayLabel:/protéger/.test(lower)?'Protéger le ballon':text,hint:'Jouer simple'};
 if(/passe|remettre|remise|décaler|servir|une-deux|jouer en une touche|centre/.test(lower))return{icon:'↗',tone:'collective',displayLabel:/remettre/.test(lower)?'Remettre le ballon':text,hint:'Jouer avec un partenaire'};
 if(/dribb|petit pont|feinte|extérieur|geste|éliminer|provoquer/.test(lower))return{icon:'✦',tone:'technical',displayLabel:text.replace(/^Tenter /i,'').replace(/^Essayer /i,''),hint:'Provoquer'};
 if(/décrocher|attirer/.test(lower))return{icon:'↩',tone:'movement',displayLabel:/décrocher.*attirer/i.test(lower)?'L’attirer vers toi':text,hint:'Puis repartir'};
 if(/presser|sprinter|revenir|intervenir|sortir fort|couper/.test(lower))return{icon:'◆',tone:'duel',displayLabel:text,hint:'Agir tout de suite'};
 return{icon:'●',tone:'balanced',displayLabel:text,hint:choice.gesture&&choice.gesture!==text?choice.gesture:'Choisir ton action'};
}
function presentChoices(choices=[],tier='u15'){
 return choices.map(choice=>{
  const meta=choiceMeta(choice),label=meta.displayLabel;
  const displayLabel=tier==='u15'&&label.length>31?label.split(/,| puis | pour | et /i)[0]:label;
  return{...choice,displayLabel,displayHint:meta.hint,displayIcon:meta.icon,displayTone:meta.tone};
 });
}

function simplifyDecision(state={},session={},step={}){
 const tier=youthMatchTier(state,session);if(!tier||step.kind!=='decision'||step.phase==='penalty_shootout')return step;
 const group=role(state.player?.position||session.playerPosition),pool=tier==='u15'?U15_SCENES:YOUTH_SCENES;
 const [title,text]=pick(seed(session,step,`${tier}:${group}:scene`),pool[group]||pool.attacker);
 const choices=presentChoices(step.choices||session.decision?.choices||[],tier);
 const compact={...step,title,text,description:text,choices,innerVoice:tier==='u15'?null:step.innerVoice||null,youthPresentationTier:tier};
 if(session.decision){session.decision={...session.decision,title,description:text,choices};}
 return compact;
}
function simplifyFlow(state={},session={},step={}){
 const tier=youthMatchTier(state,session);if(!tier||step.kind==='decision'||step.kind==='goal'||step.kind==='reactions')return step;
 if(step.phase==='match_continues'){
  const lines=tier==='u15'?['Le jeu continue. Tu te replaces et attends le prochain ballon.','Quelques minutes passent. Le ballon change souvent de camp.','Ton équipe se replace. Le prochain ballon arrive vite.']:['Le match continue. Les espaces changent et tu restes prêt pour la prochaine action.','Quelques minutes passent sans grosse occasion. Tu restes disponible.'];
  return{...step,title:tier==='u15'?'Le jeu continue':'Le match continue',text:pick(seed(session,step,`${tier}:flow`),lines),innerVoice:null,youthPresentationTier:tier};
 }
 if(step.phase==='unexpected_event'){
  const source=String(step.text||'');
  const short=source.split(/(?<=[.!?])\s+/).slice(0,tier==='u15'?1:2).join(' ');
  return{...step,text:short||step.text,innerVoice:null,youthPresentationTier:tier};
 }
 return step;
}

export function enrichYouthMatchStep(state={},session={},step=null){
 if(!step)return step;
 const decision=simplifyDecision(state,session,step);
 return simplifyFlow(state,session,decision);
}
export function enrichYouthMatchResult(state={},session={},result={}){
 const s=result.session||session;if(!s)return result;
 const step=enrichYouthMatchStep(state,s,result.step||s.step);
 if(step){s.step=step;return{...result,session:s,step,decision:step.kind==='decision'?s.decision:result.decision};}
 return result;
}

export const YouthMatchExperienceSystem=Object.freeze({youthMatchTier,enrichYouthMatchStep,enrichYouthMatchResult});
export default YouthMatchExperienceSystem;
