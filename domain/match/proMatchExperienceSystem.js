// Street to Pro — couche d'expérience réservée aux vrais matchs seniors/pro.
// Elle ne change pas les faits canoniques : elle enrichit rythme, mémoire, corps, coach et mini-histoire.

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v||'').toLowerCase();
function hash(seed=''){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function pick(list,seed){return list.length?list[hash(seed)%list.length]:null;}

const YOUTH=/u\s?(?:15|16|17|18|19|20|21|23)|youth|jeune|academy|acad[eé]mie|formation|reserve|réserve|espoirs?/i;
const SENIOR_COMP=/ligue\s?[12]|premier league|championship|la liga|serie a|bundesliga|eredivisie|primeira|champions league|europa league|conference league|coupe de france|fa cup|copa del rey|coppa italia|dfb|senior|national\b/i;

export function isProfessionalMatch(state={},session={}){
  const match=session.match||{};
  const labels=[session.competition,match.competitionName,match.ageCategory,match.category,match.level,match.phase].filter(Boolean).join(' ');
  if(YOUTH.test(labels))return false;
  if(match.professional===true||match.senior===true)return true;
  const p=state.player||{};
  const stage=text(p.careerStage||state.career?.stage||state.careerStage);
  const squad=text(p.squadStatus||p.squad||p.teamStatus);
  const contract=text(p.contract?.type||p.contractType||p.status);
  if(/professional|professionnel|\bpro\b|senior/.test(stage))return true;
  if(/first.?team|premi[eè]re.?[eé]quipe|senior/.test(squad))return true;
  if(/professional|professionnel|\bpro\b/.test(contract))return true;
  return SENIOR_COMP.test(labels);
}

function ensure(session){
  session.proExperience||={version:1,sequence:0,recentThemes:[],coachInstruction:null,bodyWarnings:0,signatureCandidates:[]};
  return session.proExperience;
}

function role(position=''){
  const p=String(position).toUpperCase();
  if(['AG','AD','LW','RW'].includes(p))return'ailier';
  if(['MC','MOC','CM','CAM'].includes(p))return'milieu';
  if(['BU','ST','CF'].includes(p))return'attaquant';
  if(['DC','DD','DG','CB','RB','LB'].includes(p))return'défenseur';
  return'joueur';
}

export function proCoachInstruction(state={},session={}){
  if(!isProfessionalMatch(state,session))return null;
  const mem=ensure(session);if(mem.coachInstruction)return mem.coachInstruction;
  const r=role(state.player?.position||session.playerPosition),scoreFor=n(session.score?.[session.home?'home':'away']),scoreAgainst=n(session.score?.[session.home?'away':'home']);
  const pool=r==='ailier'?['Fixe-le avant de partir.','Quand notre latéral monte, rentre à l’intérieur.','À la perte, cinq secondes à fond.']:
    r==='milieu'?['Avant de recevoir, regarde derrière toi.','Quand on récupère, première passe vers l’avant si elle existe.','Si ça s’emballe, c’est toi qui redonnes le tempo.']:
    r==='attaquant'?['Occupe le central, puis décroche au dernier moment.','Premier contrôle vers le but.','À la perte, ferme immédiatement leur six.']:
    r==='défenseur'?['Ne sors pas si personne ne couvre ton dos.','Première passe propre après récupération.','Gagne d’abord ta zone.']:['Reste connecté au bloc.'];
  if(scoreFor<scoreAgainst)pool.push('On doit jouer plus haut maintenant.');
  mem.coachInstruction=pick(pool,`${session.id}:coach:${r}`);
  return mem.coachInstruction;
}

function bodyLine(session={},minute=0){
  const fatigue=Math.max(n(session.modifiers?.fatigue)*11,n(session.match?.playerFatigue),n(session.playerFatigue));
  if(minute<65&&fatigue<55)return null;
  if(fatigue>=78)return pick(['Tes cuisses durcissent à chaque accélération.','Ton souffle revient moins vite entre deux courses.','Tes appuis restent propres, mais chaque redémarrage coûte davantage.'],`${session.id}:${minute}:body-hard`);
  if(minute>=78||fatigue>=55)return pick(['Tu sens les courses précédentes dans les jambes.','Le premier pas demande maintenant un peu plus d’effort.','Tu récupères encore, mais moins vite qu’en première période.'],`${session.id}:${minute}:body`);
  return null;
}

function teammateLine(session={},position=''){
  const r=role(position);
  const pools={
    ailier:['Ton latéral recommence son dédoublement : il attend de voir si tu vas enfin l’utiliser.','Le neuf attaque le premier poteau avant même que tu lèves la tête.'],
    milieu:['Ton attaquant décroche encore entre les centraux, pendant que l’ailier opposé reste très large.','Ton partenaire du milieu couvre ton déplacement et te laisse quelques mètres pour avancer.'],
    attaquant:['L’ailier te cherche du regard avant de provoquer son latéral.','Le milieu s’approche de toi : il attend ta remise pour continuer sa course.'],
    défenseur:['Ton latéral monte et te laisse quelques secondes avec davantage d’espace à couvrir.','Le milieu devant toi se retourne déjà pour offrir la première passe.'],
    joueur:['Un partenaire te montre une solution avant même que le ballon arrive.']
  };
  return pick(pools[r]||pools.joueur,`${session.id}:${session.proExperience?.sequence||0}:mate:${r}`);
}

function sequenceLine(session={},minute=0){
  const d=session.directOpponent||{},won=n(d.playerDuelsWon),lost=n(d.opponentDuelsWon);
  if(won>=2&&won>lost)return'Il ne défend plus comme au début : ton vis-à-vis garde maintenant un demi-mètre de sécurité avant de sortir.';
  if(lost>=2&&lost>won)return'Ton vis-à-vis a compris ton premier mouvement. Cette fois, il attend au lieu de se jeter.';
  if(session.proExperience?.sequence>=2)return pick(['Les deux équipes commencent à anticiper les circuits utilisés depuis le début du match.','Les espaces ne sont plus les mêmes qu’au coup d’envoi : chacun a commencé à corriger ce qui faisait mal.','Le match a une mémoire maintenant. Les mêmes mouvements déclenchent des réponses différentes.'],`${session.id}:${minute}:sequence`);
  return null;
}

export function enrichProfessionalStep(state={},session={},step=null){
  if(!step||!isProfessionalMatch(state,session))return step;
  const mem=ensure(session),minute=n(step.minute);
  if(step.kind==='decision'){
    mem.sequence+=1;
    const extras=[sequenceLine(session,minute),teammateLine(session,state.player?.position||session.playerPosition),bodyLine(session,minute)].filter(Boolean);
    if(extras.length){step={...step,text:[step.text||step.description||'',...extras].filter(Boolean).join(' '),description:[step.description||step.text||'',...extras].filter(Boolean).join(' ')};}
    return step;
  }
  if(step.phase==='kickoff'){
    const instruction=proCoachInstruction(state,session);
    if(instruction)step={...step,text:`${step.text||''} Juste avant que le jeu parte, le coach te glisse une consigne courte : « ${instruction} »`.trim()};
  }
  if(step.phase==='match_continues'||step.phase==='unexpected_event'){
    const micro=pick(['Pendant quelques minutes, tu touches peu le ballon. Tu coulisses, tu replaces, tu attends que le jeu revienne vers toi.','Le match traverse un temps faible. Les courses continuent, mais aucune action ne mérite encore d’être forcée.','Deux possessions passent sans que tu puisses vraiment peser. Tu restes dans le match par tes déplacements et tes appels.'],`${session.id}:${mem.sequence}:${step.phase}`);
    step={...step,text:`${step.text||''} ${micro}`.trim()};
  }
  return step;
}

export function enrichProfessionalOutcome(state={},session={},event=null){
  if(!event||!isProfessionalMatch(state,session))return event;
  const minute=n(event.minute),choice=text(event.choice),failed=/referme|lit ton geste|hésitation|disparaît/.test(text(event.title)+' '+text(event.text));
  if(failed){
    const recovery=pick(['Le ballon sort et l’équipe peut se replacer.','Un partenaire récupère la deuxième balle, mais l’occasion franche est passée.','La défense repousse sans pouvoir vraiment repartir : vous restez installés.'],`${session.id}:${minute}:${choice}:secondary`);
    return{...event,text:`${event.text} ${recovery}`.trim(),secondaryOutcome:'retained_pressure'};
  }
  return event;
}

export function professionalSignatureMoments(state={},session={},result=null){
  if(!result||!isProfessionalMatch(state,session))return[];
  const out=[];
  for(const e of result.events||[]){
    const minute=n(e.minute);
    if(minute>=85&&(e.isGoalOpportunity||e.gesture||e.timedOut))out.push({id:`${result.matchId}:${minute}:late`,minute,kind:'late_pressure',text:e.text});
    if(e.gesture&&/petit pont|talonnade|extérieur|panenka|volée|retourné/i.test(String(e.gesture)))out.push({id:`${result.matchId}:${minute}:gesture`,minute,kind:'signature_gesture',gesture:e.gesture,text:e.text});
  }
  const d=result.directOpponent||{};
  if(n(d.playerDuelsWon)>=3&&n(d.playerDuelsWon)>n(d.opponentDuelsWon)+1)out.push({id:`${result.matchId}:duel`,kind:'duel_dominance',text:'Ton adversaire direct a fini le match en adaptant sa manière de défendre à tes prises de balle.'});
  return out.slice(0,3);
}

export function applyProfessionalResultMemory(state={},session={},result=null){
  if(!result||!isProfessionalMatch(state,session))return result;
  result.professionalMatchLayer=true;
  result.signatureMoments=professionalSignatureMoments(state,session,result);
  result.proCoachInstruction=session.proExperience?.coachInstruction||null;
  return result;
}

export const ProMatchExperienceSystem=Object.freeze({isProfessionalMatch,proCoachInstruction,enrichProfessionalStep,enrichProfessionalOutcome,professionalSignatureMoments,applyProfessionalResultMemory});
export default ProMatchExperienceSystem;
