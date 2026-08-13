// Street to Pro — profondeur narrative réservée aux vrais matchs seniors/pro.
// Cette couche ne change jamais les faits canoniques, les choix disponibles ni la simulation.
// Elle choisit seulement quand le match mérite du silence, un détail, une voix intérieure ou l'enrichissement d'une décision existante.

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v||'').toLowerCase();
function hash(seed=''){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function pick(list,seed){return list.length?list[hash(seed)%list.length]:null;}

const YOUTH=/u\s?(?:15|16|17|18|19|20|21|23)|youth|jeune|academy|acad[eé]mie|formation|reserve|réserve|espoirs?/i;
const SENIOR_COMP=/ligue\s?[12]|premier league|championship|la liga|serie a|bundesliga|eredivisie|primeira|champions league|europa league|conference league|coupe de france|fa cup|copa del rey|coppa italia|dfb|senior|national\b/i;
const IMPORTANT_PHASES=new Set(['pre_match','kickoff','extra_time_intro','extra_time_end','penalty_shootout','penalty_result','full_time_sequence','final_whistle']);

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
  session.proExperience||={version:2,sequence:0,recentThemes:[],recentLines:[],coachInstruction:null,bodyWarnings:0,lastBodyMinute:null,lastInterventionMinute:null,signatureCandidates:[]};
  const mem=session.proExperience;
  mem.version=2;
  mem.recentThemes=Array.isArray(mem.recentThemes)?mem.recentThemes:[];
  mem.recentLines=Array.isArray(mem.recentLines)?mem.recentLines:[];
  mem.sequence=n(mem.sequence);
  mem.bodyWarnings=n(mem.bodyWarnings);
  return mem;
}

function role(position=''){
  const p=String(position).toUpperCase();
  if(['AG','AD','LW','RW'].includes(p))return'ailier';
  if(['MC','MOC','CM','CAM','MDC','CDM'].includes(p))return'milieu';
  if(['BU','ST','CF','AC'].includes(p))return'attaquant';
  if(['DC','DD','DG','CB','RB','LB'].includes(p))return'défenseur';
  if(['GK','GB','G'].includes(p))return'gardien';
  return'joueur';
}

function playerScore(session={}){return n(session.score?.[session.home?'home':'away']);}
function opponentScore(session={}){return n(session.score?.[session.home?'away':'home']);}
function scoreGap(session={}){return playerScore(session)-opponentScore(session);}
function fatigue(session={}){return Math.max(n(session.modifiers?.fatigue)*11,n(session.match?.playerFatigue),n(session.playerFatigue));}
function importance(session={}){return text(session.importance||session.match?.importance||session.type||session.match?.type);}
function highStakes(session={}){return /important|exceptional|final|rival|derby|knockout|coupe|champions|europa/.test(importance(session));}
function minuteOf(step={}){return Number.isFinite(Number(step.minute))?Number(step.minute):null;}

function remember(mem,key,line){if(key){mem.recentThemes.push(key);mem.recentThemes=mem.recentThemes.slice(-5);}if(line){mem.recentLines.push(line);mem.recentLines=mem.recentLines.slice(-6);}}
function freshPick(pool,seed,mem){if(!pool.length)return null;const start=hash(seed)%pool.length;for(let offset=0;offset<pool.length;offset++){const candidate=pool[(start+offset)%pool.length];if(!mem.recentLines.includes(candidate))return candidate;}return pool[start];}
function appendText(step,lines=[]){const extras=lines.filter(Boolean);if(!extras.length)return step;const source=step.text||step.description||'';const joined=[source,...extras].filter(Boolean).join(' ').trim();return {...step,text:joined,description:step.description?[step.description,...extras].filter(Boolean).join(' ').trim():step.description};}

export function proCoachInstruction(state={},session={}){
  if(!isProfessionalMatch(state,session))return null;
  const mem=ensure(session);if(mem.coachInstruction)return mem.coachInstruction;
  const r=role(state.player?.position||session.playerPosition),gap=scoreGap(session);
  const pool=r==='ailier'?['Fixe-le avant de partir.','Quand notre latéral monte, rentre à l’intérieur.','À la perte, cinq secondes à fond.']:
    r==='milieu'?['Avant de recevoir, regarde derrière toi.','Quand on récupère, première passe vers l’avant si elle existe.','Si ça s’emballe, c’est toi qui redonnes le tempo.']:
    r==='attaquant'?['Occupe le central, puis décroche au dernier moment.','Premier contrôle vers le but.','À la perte, ferme immédiatement leur six.']:
    r==='défenseur'?['Ne sors pas si personne ne couvre ton dos.','Première passe propre après récupération.','Gagne d’abord ta zone.']:
    r==='gardien'?['Parle tôt à ta ligne.','Sur la première relance, ne force rien.','Reste haut quand le bloc avance.']:['Reste connecté au bloc.'];
  if(gap<0)pool.push('On doit jouer plus haut maintenant.');
  mem.coachInstruction=pick(pool,`${session.id}:coach:${r}:${gap}`);
  return mem.coachInstruction;
}

function prematchLine(state={},session={},mem){
  const r=role(state.player?.position||session.playerPosition),stakes=highStakes(session);
  const pools={
    ailier:['Pendant les dernières consignes, tu regardes surtout l’espace entre leur latéral et leur central. C’est là que ton premier appel peut vraiment les faire reculer.','Le tableau tactique reste ouvert devant le groupe. Sur ton côté, le staff insiste surtout sur le moment où tu devras quitter la ligne.'],
    milieu:['Le staff revient une dernière fois sur leurs sorties de pressing. Tu sais déjà où regarder avant de recevoir ton premier ballon.','Sur le tableau, deux zones sont entourées au milieu. Le coach veut que tu sentes laquelle s’ouvre avant que le banc ait besoin de te le dire.'],
    attaquant:['Le coach te montre encore la distance entre leurs deux centraux. Ton premier duel ne se jouera peut-être pas avec le ballon.','Tu observes leurs défenseurs pendant l’échauffement. L’un attaque vite le porteur, l’autre protège davantage la profondeur.'],
    défenseur:['Les dernières consignes portent sur la couverture dans ton dos et sur la première passe après récupération. Rien de spectaculaire, mais tout peut partir de là.','Tu regardes leurs appels pendant les dernières minutes d’échauffement. Le staff t’a demandé de ne pas te laisser attirer trop loin de ta zone.'],
    gardien:['Avant de sortir, tu repères une dernière fois la hauteur de ta ligne et les joueurs chargés des coups de pied arrêtés.','Le coach des gardiens te parle encore quelques secondes. Ensuite, il n’y aura plus que tes décisions et les voix devant toi.'],
    joueur:['Les dernières consignes se terminent. Chacun sait désormais quel premier détail il doit surveiller.']
  };
  let line=freshPick(pools[r]||pools.joueur,`${session.id}:prematch:${r}`,mem);if(stakes)line=`${line} Personne n’a besoin d’ajouter que ce rendez-vous pèse davantage qu’un match ordinaire.`;remember(mem,'prematch',line);return line;
}

function bodyLine(session={},minute=0,mem){
  const value=fatigue(session);if(minute<65&&value<55)return null;if(mem.lastBodyMinute!==null&&minute-mem.lastBodyMinute<14)return null;
  const pool=value>=78?['Tes cuisses durcissent à chaque accélération.','Ton souffle revient moins vite entre deux courses.','Tes appuis restent propres, mais chaque redémarrage coûte davantage.']:['Tu sens les courses précédentes dans les jambes.','Le premier pas demande maintenant un peu plus d’effort.','Tu récupères encore, mais moins vite qu’en première période.'];
  const line=freshPick(pool,`${session.id}:${minute}:body:${mem.bodyWarnings}`,mem);if(line){mem.bodyWarnings+=1;mem.lastBodyMinute=minute;remember(mem,'body',line);}return line;
}

function teammateLine(session={},position='',mem){
  const r=role(position);
  const pools={
    ailier:['Ton latéral recommence son dédoublement : il attend de voir si tu vas enfin l’utiliser.','Le neuf attaque le premier poteau avant même que tu lèves la tête.','Le milieu côté ballon vient plus près de toi pour t’offrir une sortie si ton vis-à-vis ferme la ligne.'],
    milieu:['Ton attaquant décroche entre les centraux pendant que l’ailier opposé reste très large.','Ton partenaire du milieu couvre ton déplacement et te laisse quelques mètres pour avancer.','Le latéral te donne une solution courte, mais le neuf commence déjà son appel dans le dos.'],
    attaquant:['L’ailier te cherche du regard avant de provoquer son latéral.','Le milieu s’approche de toi : il attend ta remise pour continuer sa course.','Un central te suit jusque dans les pieds ; derrière lui, ton partenaire attaque immédiatement l’espace libéré.'],
    défenseur:['Ton latéral monte et te laisse quelques secondes avec davantage d’espace à couvrir.','Le milieu devant toi se retourne déjà pour offrir la première passe.','Ton partenaire de charnière resserre vers toi avant que leur attaquant ne déclenche son appel.'],
    gardien:['Ta ligne remonte de quelques mètres. Tu dois décider tout de suite jusqu’où tu l’accompagnes.','Ton central s’écarte pour la relance pendant que leur attaquant hésite entre couper la passe et venir te presser.'],
    joueur:['Un partenaire te montre une solution avant même que le ballon arrive.']
  };
  const line=freshPick(pools[r]||pools.joueur,`${session.id}:${mem.sequence}:mate:${r}`,mem);if(line)remember(mem,'teammate',line);return line;
}

function sequenceLine(session={},minute=0,mem){
  const d=session.directOpponent||{},won=n(d.playerDuelsWon),lost=n(d.opponentDuelsWon);let line=null;
  if(won>=2&&won>lost)line='Il ne défend plus comme au début : ton vis-à-vis garde maintenant un demi-mètre de sécurité avant de sortir.';
  else if(lost>=2&&lost>won)line='Ton vis-à-vis a compris ton premier mouvement. Cette fois, il attend au lieu de se jeter.';
  else if(mem.sequence>=2)line=freshPick(['Les deux équipes commencent à anticiper les circuits utilisés depuis le début du match.','Les espaces ne sont plus les mêmes qu’au coup d’envoi : chacun a commencé à corriger ce qui faisait mal.','Les mêmes mouvements ne provoquent plus les mêmes réponses. Le match a déjà une mémoire.'],`${session.id}:${minute}:sequence`,mem);
  if(line&&!mem.recentLines.includes(line)){remember(mem,'sequence',line);return line;}return null;
}

function pressureLine(session={},minute=0,mem){
  if(minute<68)return null;const gap=scoreGap(session),home=session.home!==false;
  const pool=gap<0?(home?['À chaque récupération, les tribunes réclament que l’équipe joue plus vite. Le temps restant commence à se sentir dans chaque passe latérale.','Le bruit monte dès que vous franchissez la ligne médiane. Personne dans le stade n’a envie de voir l’action repartir derrière.']:['Le public adverse accompagne chaque seconde gagnée. Il faut maintenant créer du rythme sans offrir la transition qu’ils attendent.','Le stade se nourrit de chaque ballon qu’ils gardent loin de leur but. À vous de casser cette maîtrise.']):gap===0?['Le score tient encore sur un détail. Même les possessions calmes ont quelque chose de plus tendu maintenant.','Chaque ballon perdu déclenche une réaction immédiate autour du terrain. Le match est encore assez ouvert pour basculer d’un seul geste.']:['L’adversaire doit se découvrir davantage. Les espaces arrivent, mais chaque ballon mal géré peut aussi lui rendre de l’espoir.','Le stade veut que l’équipe continue d’attaquer, alors que le match commence aussi à demander de savoir respirer.'];
  const line=freshPick(pool,`${session.id}:${minute}:pressure:${gap}`,mem);if(line)remember(mem,'pressure',line);return line;
}

function innerVoiceLine(session={},minute=0,mem){
  const gap=scoreGap(session),value=fatigue(session),pool=[];
  if(gap<0&&minute>=75)pool.push('Tu sens le temps se réduire. Il faut provoquer quelque chose sans jouer le prochain ballon avant de l’avoir reçu.','La prochaine ouverture peut être la dernière vraiment propre. Tu essaies de ne pas la chercher trop tôt.');
  if(gap===0&&minute>=80)pool.push('Tu n’as plus envie d’un match presque réussi. Le prochain détail peut décider de tout.','Tu sens que tout le monde attend le geste de trop. Rester lucide devient presque une action en soi.');
  if(value>=78)pool.push('Tes jambes te demandent de choisir tes courses. Ta tête, elle, doit rester aussi rapide qu’au début.');
  if(highStakes(session)&&minute>=70)pool.push('Le contexte essaie de rendre chaque ballon plus grand qu’il ne l’est. Tu t’accroches au suivant.');
  const line=freshPick(pool,`${session.id}:${minute}:inner:${mem.sequence}`,mem);if(line)remember(mem,'inner_voice',line);return line;
}

function meaningfulContext(session={},step={}){
  const minute=minuteOf(step),gap=Math.abs(scoreGap(session)),value=fatigue(session),d=session.directOpponent||{};
  if(IMPORTANT_PHASES.has(step.phase)||step.kind==='decision'||step.phase==='unexpected_event')return true;
  if(minute!==null&&minute>=70&&(gap<=1||highStakes(session)))return true;
  if(value>=70)return true;
  if(Math.abs(n(d.playerDuelsWon)-n(d.opponentDuelsWon))>=2)return true;
  return false;
}

export function professionalNarrativeMode(state={},session={},step=null){
  if(!step||!isProfessionalMatch(state,session))return'off';
  if(step.kind==='decision')return'decision';
  if(!meaningfulContext(session,step))return'silent';
  const minute=minuteOf(step);
  if(minute!==null&&minute>=72&&(scoreGap(session)<=0||fatigue(session)>=78||highStakes(session))&&hash(`${session.id}:${step.phase}:${minute}:voice`)%3===0)return'inner_voice';
  return'detail';
}

function canIntervene(mem,step,mode){if(mode==='decision'||IMPORTANT_PHASES.has(step.phase)||step.phase==='unexpected_event')return true;const minute=minuteOf(step);if(minute===null)return true;if(mem.lastInterventionMinute!==null&&minute-mem.lastInterventionMinute<10)return false;return true;}

export function enrichProfessionalStep(state={},session={},step=null){
  if(!step||!isProfessionalMatch(state,session))return step;
  const mem=ensure(session),minute=minuteOf(step)??0,mode=professionalNarrativeMode(state,session,step);
  if(mode==='silent'||mode==='off'||!canIntervene(mem,step,mode))return step;
  if(step.phase==='pre_match'){const line=prematchLine(state,session,mem);mem.lastInterventionMinute=0;return appendText(step,[line]);}
  if(step.phase==='kickoff'){
    const instruction=proCoachInstruction(state,session),trust=n(session.coachTrust??state.player?.stats?.relationCoach??50);if(!instruction)return step;
    const framing=trust>=68?`Juste avant que le jeu parte, le coach te retient une seconde : « ${instruction} » Puis il te laisse repartir avec un simple signe de tête.`:trust<=35?`Juste avant le coup d’envoi, le coach te répète une dernière fois : « ${instruction} » Il veut être certain que le message est passé.`:`Juste avant que le jeu parte, le coach te glisse une consigne courte : « ${instruction} »`;
    remember(mem,'coach',framing);mem.lastInterventionMinute=0;return appendText(step,[framing]);
  }
  if(step.kind==='decision'){
    mem.sequence+=1;const extras=[];const sequence=sequenceLine(session,minute,mem);if(sequence)extras.push(sequence);if(extras.length<2){const teammate=teammateLine(session,state.player?.position||session.playerPosition,mem);if(teammate)extras.push(teammate);}if(extras.length<2){const body=bodyLine(session,minute,mem);if(body)extras.push(body);}if(minute>=74&&extras.length<2){const pressure=pressureLine(session,minute,mem);if(pressure)extras.push(pressure);}
    let enriched=appendText(step,extras.slice(0,2));if(!enriched.innerVoice&&minute>=72&&hash(`${session.id}:${mem.sequence}:decision-voice`)%4===0){const voice=innerVoiceLine(session,minute,mem);if(voice)enriched={...enriched,innerVoice:voice};}mem.lastInterventionMinute=minute;return enriched;
  }
  if(mode==='inner_voice'){const voice=innerVoiceLine(session,minute,mem);if(voice){mem.lastInterventionMinute=minute;return step.innerVoice?step:{...step,innerVoice:voice};}}
  if(step.phase==='match_continues'||step.phase==='unexpected_event'){
    const extras=[];const sequence=sequenceLine(session,minute,mem);if(sequence)extras.push(sequence);if(minute>=68){const pressure=pressureLine(session,minute,mem);if(pressure)extras.push(pressure);}if(extras.length<2){const body=bodyLine(session,minute,mem);if(body)extras.push(body);}if(!extras.length)return step;mem.lastInterventionMinute=minute;return appendText(step,extras.slice(0,2));
  }
  return step;
}

export function enrichProfessionalOutcome(state={},session={},event=null){
  if(!event||!isProfessionalMatch(state,session))return event;
  const minute=n(event.minute),choice=text(event.choice),failed=/referme|lit ton geste|hésitation|disparaît/.test(text(event.title)+' '+text(event.text));
  if(failed){const mem=ensure(session),recovery=freshPick(['Le ballon sort et l’équipe peut se replacer.','Un partenaire récupère la deuxième balle, mais l’occasion franche est passée.','La défense repousse sans pouvoir vraiment repartir : vous restez installés.'],`${session.id}:${minute}:${choice}:secondary`,mem);remember(mem,'secondary_outcome',recovery);return{...event,text:`${event.text} ${recovery}`.trim(),secondaryOutcome:'retained_pressure'};}
  return event;
}

export function professionalSignatureMoments(state={},session={},result=null){
  if(!result||!isProfessionalMatch(state,session))return[];const out=[];
  for(const e of result.events||[]){const minute=n(e.minute);if(minute>=85&&(e.isGoalOpportunity||e.gesture||e.timedOut))out.push({id:`${result.matchId}:${minute}:late`,minute,kind:'late_pressure',text:e.text});if(e.gesture&&/petit pont|talonnade|extérieur|panenka|volée|retourné/i.test(String(e.gesture)))out.push({id:`${result.matchId}:${minute}:gesture`,minute,kind:'signature_gesture',gesture:e.gesture,text:e.text});}
  const firstGoal=result.goalEvents?.[0];if(n(result.goals)>0&&firstGoal)out.push({id:`${result.matchId}:${n(firstGoal.minute)}:goal`,minute:n(firstGoal.minute),kind:'goal_memory',text:`Ton but à la ${n(firstGoal.minute)}e minute reste l’un des repères de ce match.`});
  const d=result.directOpponent||{};if(n(d.playerDuelsWon)>=3&&n(d.playerDuelsWon)>n(d.opponentDuelsWon)+1)out.push({id:`${result.matchId}:duel`,kind:'duel_dominance',text:'Ton adversaire direct a fini le match en adaptant sa manière de défendre à tes prises de balle.'});
  const seen=new Set();return out.filter(item=>{if(seen.has(item.id))return false;seen.add(item.id);return true;}).slice(0,3);
}

export function applyProfessionalResultMemory(state={},session={},result=null){
  if(!result||!isProfessionalMatch(state,session))return result;const mem=ensure(session),signatureMoments=professionalSignatureMoments(state,session,result);
  result.professionalMatchLayer=true;result.signatureMoments=signatureMoments;result.proCoachInstruction=mem.coachInstruction||null;
  result.proNarrativeMemory={version:2,matchId:result.matchId||session.id||null,opponent:result.opponent||session.opponent||null,competition:result.competitionName||session.competition||null,result:result.result||null,score:result.score?{...result.score}:null,rating:Number.isFinite(Number(result.rating))?Number(result.rating):null,goals:n(result.goals),assists:n(result.assists),coachInstruction:mem.coachInstruction||null,themes:[...new Set(mem.recentThemes)].slice(-5),signatureMoments:signatureMoments.map(item=>({id:item.id,kind:item.kind,minute:item.minute??null,gesture:item.gesture||null}))};
  return result;
}

export const ProMatchExperienceSystem=Object.freeze({isProfessionalMatch,proCoachInstruction,professionalNarrativeMode,enrichProfessionalStep,enrichProfessionalOutcome,professionalSignatureMoments,applyProfessionalResultMemory});
export default ProMatchExperienceSystem;
