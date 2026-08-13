// Street to Pro — narration contextuelle des respirations entre décisions.
// Cette couche ne change aucun fait ni aucun effet mécanique : elle remplace
// seulement les transitions génériques par ce que le joueur est réellement en train de vivre.

const n=value=>Number.isFinite(Number(value))?Number(value):0;
function hash(seed=''){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function pick(seed,items=[]){return items.length?items[hash(seed)%items.length]:'';}
function positionGroup(position=''){const p=String(position||'').toUpperCase();if(['GK','GB','G'].includes(p))return'goalkeeper';if(['DC','CB','DD','RB','DG','LB','D'].includes(p))return'defender';if(['MC','CM','MOC','CAM','MDC','CDM','MD','MG','M'].includes(p))return'midfielder';if(['AG','LW','AD','RW'].includes(p))return'winger';return'attacker';}
function contextText(session={}){return[session.competition,session.match?.competitionName,session.match?.competition,session.match?.ageCategory,session.match?.category,session.match?.level].filter(Boolean).join(' ').toLowerCase();}
function tier(session={}){const age=n(session.playerAge??session.match?.playerAge??session.match?.age),text=contextText(session);if((age&&age<=15)||/u ?15|moins de 15/.test(text))return'u15';if((age&&age<=20)||/youth|u ?1[6789]|u ?20|formation|academy|académie/.test(text))return'youth';if(/amateur|semi.?pro|régional|regional|national 2|national 3|district/.test(text))return'semi';return'pro';}
function ownScore(session={}){return n(session.score?.[session.home?'home':'away']);}
function oppScore(session={}){return n(session.score?.[session.home?'away':'home']);}
function scoreState(session={}){const own=ownScore(session),opp=oppScore(session);return own>opp?'leading':own<opp?'trailing':'level';}
function fatigue(session={}){return Math.max(n(session.playerFatigue),n(session.match?.playerFatigue),n(session.modifiers?.fatigue)*11);}
function minute(session={},step={}){return n(step.minute??session.moments?.[session.currentMoment]??0);}
function latestEvent(session={}){const events=Array.isArray(session.events)?session.events:[];return events.length?events[events.length-1]:null;}
function failed(event={}){return Boolean(event.timedOut)||/referme|lit ton geste|récupère|disparaît|ne passe pas|trop long/i.test(`${event.title||''} ${event.text||''}`);}
function wonDuel(event={}){return !failed(event)&&/duel|vis-à-vis|retard|ligne est cassée|brèche/i.test(`${event.title||''} ${event.text||''}`);}
function directState(session={}){const d=session.directOpponent||{},won=n(d.playerDuelsWon),lost=n(d.opponentDuelsWon);if(won>=2&&won>lost)return'dominating';if(lost>=2&&lost>won)return'suffering';return'balanced';}
function seed(session={},step={},key='flow'){return`${session.match?.id||session.id}:${session.currentMoment||0}:${minute(session,step)}:${key}`;}

const ROLE_FLOW={
 goalkeeper:{
  leading:['Tu restes haut derrière ton bloc. À chaque ballon rendu, tu regardes d’abord la profondeur avant de demander à la ligne de remonter.','Le jeu se passe loin de toi pendant quelques minutes, mais tu ne décroches pas : tu ajustes ta défense à chaque déplacement adverse.'],
  level:['Le ballon change plusieurs fois de camp sans entrer dans ta surface. Tu restes sur l’avant des appuis, prêt pour la première passe qui cassera une ligne.','Ton équipe construit, perd, récupère. De ton but, tu continues de replacer la ligne avant que la prochaine transition ne parte.'],
  trailing:['Ton bloc monte de quelques mètres. Tu joues presque en couverture derrière les centraux, parce que rendre le ballon trop vite n’est plus une option.','Chaque récupération doit repartir vite. Tu cherches immédiatement la relance qui peut remettre ton équipe face au jeu.']
 },
 defender:{
  leading:['Tu ne suis pas le ballon des yeux : tu surveilles surtout l’appel dans ton dos. L’adversaire commence à jouer plus direct.','Ton équipe a l’avantage et la ligne se resserre. Tu choisis quand sortir et quand laisser l’adversaire recevoir dos au but.'],
  level:['Les attaquants alternent décrochages et appels. Tu échanges deux mots avec ton partenaire pour ne pas être aspiré au même moment.','Le match se joue sur les distances. Un mètre trop haut ouvre la profondeur ; un mètre trop bas donne le temps de se retourner.'],
  trailing:['Tu prends davantage de risques à la relance. Une passe cassant la première ligne vaut maintenant plus qu’une possession stérile.','Ton latéral monte plus haut et tu dois couvrir une zone plus large derrière lui. La moindre perte peut lancer l’adversaire.']
 },
 midfielder:{
  leading:['Tu ralentis une possession, puis accélères la suivante. Leur milieu hésite désormais entre venir te chercher et protéger l’espace derrière lui.','Tu te rends disponible derrière leur première ligne. L’objectif n’est plus de forcer : c’est de leur faire courir un déplacement de plus avant de jouer vers l’avant.'],
  level:['Le ballon passe plusieurs fois par ta zone. Tu joues à une touche quand la pression arrive et tu te retournes seulement quand le milieu adverse cesse de te suivre.','Tu changes de hauteur entre deux possessions. Une fois près des centraux, une fois entre les lignes : ton vis-à-vis doit choisir ce qu’il abandonne.'],
  trailing:['Tu demandes le ballon plus tôt. Le jeu doit avancer avant que leur bloc ait le temps de retrouver ses distances.','Tu prends une position plus haute entre deux milieux adverses. Recevoir devient plus difficile, mais chaque contrôle face au jeu peut ouvrir la dernière ligne.']
 },
 winger:{
  leading:['Le latéral adverse monte davantage et laisse enfin de l’espace derrière lui. Tu restes large assez longtemps pour l’obliger à choisir.','Tu alternes un appel dans le dos et un décrochage court. Ton vis-à-vis ne peut plus simplement attendre ta prochaine prise de balle.'],
  level:['Tu restes quelques minutes sans ballon, collé à la ligne. Puis une transversale oblige ton vis-à-vis à défendre en reculant.','Ton latéral vient plus près de toi. Par moments vous jouez à deux ; sur l’action suivante, son appel sert seulement à libérer ton un-contre-un.'],
  trailing:['Tu rentres davantage dans le demi-espace quand le ballon est de l’autre côté. Le but est de te rapprocher de la surface sans y arriver trop tôt.','Ton équipe attaque plus vite. Tu dois décider à chaque récupération : rester large pour étirer ou partir immédiatement dans le dos.']
 },
 attacker:{
  leading:['Les centraux avancent d’un pas quand ton équipe recule. Tu restes entre eux pour garder la menace d’un appel dès la récupération.','Tu touches peu le ballon pendant quelques minutes, mais chacun de tes déplacements oblige leur ligne à rester cinq mètres plus basse.'],
  level:['Tu décroches une fois, puis tu repars immédiatement dans le dos sur l’action suivante. Les deux centraux commencent à se parler davantage.','Le ballon arrive rarement proprement. Tu travailles surtout pour garder un central occupé et offrir une deuxième balle au milieu.'],
  trailing:['Tu restes plus proche de la surface. Chaque centre potentiel doit maintenant trouver une présence avant que leur bloc ne se reforme.','Tu demandes aux milieux de jouer plus tôt dans la profondeur. Les centraux savent ce qui arrive, mais ils doivent quand même reculer.']
 }
};

function memoryLine(session={}){
 const event=latestEvent(session),direct=directState(session);
 if(event&&failed(event))return pick(`${seed(session,event,'after-fail')}`,['Sur la possession suivante, tu simplifies ton premier geste. Le match ne te laisse pas le temps de rejouer immédiatement l’action précédente.','Tu te replaces sans chercher à effacer l’erreur sur le ballon suivant. L’occasion de répondre viendra plus tard.']);
 if(event&&wonDuel(event))return pick(`${seed(session,event,'after-win')}`,['Ton adversaire direct garde maintenant un peu plus de distance avant de sortir sur toi.','La prochaine fois que tu te rends disponible, ton vis-à-vis ne vient plus aussi franchement. Le dernier duel a laissé une trace.']);
 if(direct==='dominating')return'Ton vis-à-vis commence à défendre en reculant. Il préfère maintenant te donner un mètre plutôt que te laisser partir dans son dos.';
 if(direct==='suffering')return'Ton adversaire direct vient te chercher plus tôt. Il a senti que les derniers duels tournaient de son côté.';
 return'';
}
function physicalLine(session={},step={}){
 const value=fatigue(session),m=minute(session,step);
 if(value>=72||m>=82)return pick(`${seed(session,step,'heavy')}`,['À la remise en place, tu prends une respiration plus longue. Les courses doivent maintenant être choisies, pas simplement multipliées.','Tes jambes répondent encore, mais le retour après chaque accélération coûte davantage. Tu commences à économiser les courses inutiles.']);
 if(value>=52||m>=67)return pick(`${seed(session,step,'fatigue')}`,['Les espaces grandissent à mesure que les blocs s’étirent. Chaque course pèse un peu plus qu’en première période.','Les replacements deviennent moins propres des deux côtés. Une passe simple peut maintenant éliminer deux joueurs fatigués.']);
 return'';
}
function youthAtmosphere(session={},step={}){
 const level=tier(session);if(!['u15','youth'].includes(level))return'';
 return pick(`${seed(session,step,'youth')}`,level==='u15'?
  ['Depuis la ligne, ton coach replace deux joueurs d’un geste. Les parents suivent l’action à quelques mètres, mais sur le terrain tu n’entends surtout que les appels de tes partenaires.','Le banc parle beaucoup plus que le public. Une consigne traverse le terrain, puis le jeu reprend avant même que tout le monde l’ait entendue.']:
  ['Les éducateurs restent debout près de la zone technique. Une consigne courte accompagne chaque changement de hauteur du bloc.','Autour du terrain, les voix retombent dès que le ballon accélère. Sur la pelouse, les partenaires communiquent davantage à mesure que le match se resserre.']);
}

export function buildContextualFlowMoment(state={},session={},step={}){
 const group=positionGroup(state.player?.position||state.player?.positionId||session.playerPosition),status=scoreState(session),base=pick(seed(session,step,`role:${group}:${status}`),ROLE_FLOW[group]?.[status]||ROLE_FLOW.midfielder.level),memory=memoryLine(session),physical=physicalLine(session,step),youth=youthAtmosphere(session,step);
 const supplements=[memory,physical,youth].filter(Boolean);
 const supplement=supplements.length?supplements[hash(seed(session,step,'supplement'))%supplements.length]:'';
 const title=status==='leading'?pick(seed(session,step,'title-leading'),['Le match s’étire','Ils doivent prendre plus de risques','L’espace change de camp']):status==='trailing'?pick(seed(session,step,'title-trailing'),['Il faut aller les chercher','Le temps commence à compter','Ton équipe monte d’un cran']):pick(seed(session,step,'title-level'),['Le match cherche son côté','Les distances changent','Personne ne prend encore le dessus']);
 return{title,text:`${base}${supplement?` ${supplement}`:''}`};
}

function contextualUnexpected(session={},context={},step={}){
 const group=positionGroup(session.playerPosition),level=tier(session),m=minute(session,step);
 const variants={
  opponent_press:{
   goalkeeper:['Leur première ligne monte jusqu’à ta surface sur les relances. Tu dois décider plus vite si tu trouves le joueur libre ou si tu allonges.'],
   defender:['Leur attaquant ne te laisse plus avancer balle au pied. À chaque relance, un deuxième joueur coupe la passe intérieure.'],
   midfielder:['Leur milieu sort désormais dès que tu te rends disponible dos au jeu. Le contrôle suivant doit déjà contenir la solution.'],
   winger:['Leur latéral te suit plus haut et le milieu côté ballon vient fermer l’intérieur. La réception facile disparaît.'],
   attacker:['Le premier défenseur te colle au décrochage pendant que le second protège la profondeur. Ils essaient de t’enlever les deux solutions à la fois.']
  },
  space_opens:{
   goalkeeper:['Leur pressing devient moins coordonné. Une relance au sol peut désormais trouver directement un milieu face au jeu.'],
   defender:['Leur première ligne ne coulisse plus ensemble. En portant le ballon quelques mètres, tu peux obliger un milieu à sortir de sa zone.'],
   midfielder:['Entre leur milieu et leur défense, l’espace s’ouvre enfin. Tu peux recevoir face au jeu si ton déplacement part au bon moment.'],
   winger:['Leur latéral commence à être isolé. Le milieu qui venait l’aider arrive maintenant une seconde trop tard.'],
   attacker:['Les deux centraux ne montent plus ensemble. Entre celui qui suit et celui qui couvre, une zone apparaît pour un appel diagonal.']
  },
  coach_shift:{
   goalkeeper:['Depuis la zone technique, le coach te demande de relancer plus vite dès que tu captes le ballon. Il veut attaquer avant leur replacement.'],
   defender:['Le coach te fait avancer de quelques mètres quand ton équipe a le ballon. Il veut enfermer l’adversaire plus haut.'],
   midfielder:['Le coach te montre l’espace derrière leur premier milieu : « Reçois là, puis joue vers l’avant. »'],
   winger:['Le coach te demande de rester large sur les deux prochaines possessions. Il veut forcer leur latéral à sortir de sa zone.'],
   attacker:['Le coach te fait signe d’arrêter de décrocher sur chaque ballon. Il veut te garder plus près des centraux.']
  },
  direct_opponent:{
   goalkeeper:['L’attaquant adverse change sa course sur tes relances et cherche maintenant à fermer ton pied fort.'],
   defender:['Ton adversaire change son point de départ. Il ne vient plus dans ta zone de la même manière sur les appels.'],
   midfielder:['Ton vis-à-vis ne te suit plus partout. Il te laisse décrocher mais ferme maintenant la passe qui te remettrait face au jeu.'],
   winger:['Ton latéral adverse garde désormais un demi-mètre de sécurité. Il a cessé de défendre uniquement sur ton premier appui.'],
   attacker:['Le central qui te suit échange sa mission avec son partenaire. Sur le prochain appel, ce n’est plus le même défenseur qui sortira.']
  },
  tempo_drop:{
   goalkeeper:['Pendant plusieurs possessions, aucun bloc ne veut se découvrir. Tu touches surtout le ballon pour relancer proprement et replacer ta ligne.'],
   defender:['Le match ralentit. Tu enchaînes couvertures et passes simples sans qu’aucune action ne mérite d’être forcée.'],
   midfielder:['Pendant quelques minutes, tu joues surtout pour conserver les bonnes distances. Peu de ballons cassent une ligne, mais chaque placement prépare la prochaine accélération.'],
   winger:['Le ballon reste longtemps de l’autre côté. Tu ajustes ta hauteur, repars, reviens : ton travail existe même sans toucher le ballon.'],
   attacker:['Tu touches très peu le ballon pendant quelques minutes. Tu continues pourtant d’occuper les centraux pour empêcher leur bloc de monter gratuitement.']
  }
 };
 if(context.id==='crowd_surge'){
  if(level==='u15')return'Une décision arbitrale fait réagir quelques parents près de la ligne. Sur le terrain, le coach demande immédiatement au groupe de rester dans le match.';
  if(level==='youth')return'Une décision arbitrale fait monter les voix autour du terrain. Les éducateurs rappellent aussitôt aux joueurs de ne pas sortir du match.';
  if(level==='semi')return'Une décision arbitrale réveille la petite tribune et les deux bancs. Les duels suivants arrivent avec un peu plus de tension.';
  return'Une décision arbitrale fait monter le stade d’un cran. Les deux équipes jouent les possessions suivantes avec davantage de nervosité.';
 }
 const pool=variants[context.id]?.[group];
 return pool?.[hash(seed(session,{...step,minute:m},`unexpected:${context.id}:${group}`))%pool.length]||context.text||'';
}

export function enrichMatchFlowStep(state={},session={},step=null){
 if(!step)return step;
 if(step.phase==='match_continues'){
  const flow=buildContextualFlowMoment(state,session,step);
  return{...step,title:flow.title,text:flow.text,innerVoice:null};
 }
 if(step.phase==='unexpected_event'&&session.unexpectedContext){
  return{...step,text:contextualUnexpected(session,session.unexpectedContext,step),innerVoice:null};
 }
 return step;
}

export const MatchFlowExperienceSystem=Object.freeze({buildContextualFlowMoment,enrichMatchFlowStep});
export default MatchFlowExperienceSystem;
