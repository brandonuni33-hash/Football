// Compose les étapes présentables d'un match jouable. Ce module ne modifie pas le State.

const scoreSnapshot = session => ({ home: Number(session?.score?.home) || 0, away: Number(session?.score?.away) || 0 });

function step(session, values = {}) {
    return {
        id: `${session.id}:${values.phase}`,
        phase: values.phase,
        kind: values.kind || 'narration',
        label: values.label || 'MATCH',
        progress: Number(values.progress) || 0,
        minute: values.minute ?? null,
        title: values.title || '', text: values.text || '',
        team: session.team, opponent: session.opponent, competition: session.competition,
        home: session.home, score: scoreSnapshot(session), choices: values.choices || [], items: values.items || [],
        // Une scène narrative n'avance jamais seule. Seules les décisions explicitement
        // marquées timedDecision peuvent expirer dans l'UI.
        timedDecision: values.timedDecision || null,
        actionLabel: values.actionLabel || 'Continuer'
    };
}

function stakesText(session) {
    if (session.type === 'final') return `Une finale face à ${session.opponent}. Chaque ballon peut changer une carrière.`;
    if (session.type === 'rival') return `Le stade gronde déjà. Face à ${session.opponent}, personne ne veut céder un centimètre.`;
    if (session.importance === 'important' || session.importance === 'exceptional') return `Ce rendez-vous contre ${session.opponent} peut peser lourd dans la dynamique de la saison.`;
    return `Les tribunes se remplissent pendant que les deux équipes terminent leur échauffement.`;
}

export function buildPreMatchStep(session) { return step(session, { phase:'pre_match', label:'AVANT-MATCH', progress:4, title:`${session.team} · ${session.opponent}`, text:stakesText(session), actionLabel:'Entrer sur la pelouse' }); }
export function buildKickoffStep(session) {
    const venue = session.home ? 'Ton public pousse dès les premières passes.' : 'Le stade adverse tente de couvrir les voix de ton équipe.';
    return step(session, { phase:'kickoff', label:'COUP D’ENVOI', progress:10, minute:0, title:'Le ballon roule', text:`${venue} Le match cherche encore son rythme.`, actionLabel:'Continuer' });
}
export function buildDecisionStep(session, decision, index) {
    const total = Math.max(1, session.moments?.length || 1);
    return step(session, { phase:`moment_${index+1}`, kind:'decision', label:`MOMENT ${index+1}/${total}`, progress:Math.round(18 + ((index+1)/(total+1))*62), minute:decision.minute, title:decision.title, text:decision.description, choices:decision.choices, timedDecision:decision.timedDecision || null, actionLabel:'Choisir' });
}
export function buildConsequenceStep(session, event, index) { return step(session, { phase:`consequence_${index+1}`, label:'CONSÉQUENCE', progress:Math.min(86, 28 + index*13), minute:event.minute, title:event.title || 'Ta décision change la séquence', text:event.text, actionLabel:'Continuer' }); }
export function buildContinuationStep(session) {
    const teamGoals=session.score[session.home?'home':'away'], opponentGoals=session.score[session.home?'away':'home'];
    const text=teamGoals>opponentGoals?`${session.opponent} avance ses lignes. Ton équipe doit maintenant résister sans renoncer à jouer.`:teamGoals<opponentGoals?`Le temps défile et ton équipe doit prendre davantage de risques pour revenir.`:`Le rapport de force reste indécis. Une seule accélération peut faire basculer le match.`;
    return step(session,{phase:'match_continues',label:'LE MATCH CONTINUE',progress:52,minute:session.moments?.[session.currentMoment]||48,title:'Le jeu reprend ses droits',text,actionLabel:'Continuer'});
}

const UNEXPECTED_CONTEXTS=[
{id:'opponent_press',title:'L’adversaire change de rythme',text:'Le bloc adverse monte soudainement de vingt mètres et étouffe les premières relances.',effects:{rating:-.04,fatigue:2,opponentThreat:.16}},
{id:'space_opens',title:'Une brèche apparaît',text:'Un défenseur adverse semble touché. Des espaces commencent à s’ouvrir entre les lignes.',effects:{goal:.07,assist:.04,opponentThreat:-.03}},
{id:'crowd_surge',title:'Le stade se réveille',text:'Une décision arbitrale met le feu aux tribunes. Le match devient plus rapide et plus nerveux.',effects:{rating:.05,fatigue:1,cards:.04,opponentThreat:.06}},
{id:'coach_shift',title:'Le coach change le plan',text:'Depuis la ligne de touche, le coach exige davantage de liberté entre les lignes.',effects:{goal:.04,assist:.06,rating:.04,opponentThreat:.02}}];
export function createUnexpectedContext(session,roll=Math.random()){const index=Math.min(UNEXPECTED_CONTEXTS.length-1,Math.floor(Math.max(0,roll)*UNEXPECTED_CONTEXTS.length));return{...UNEXPECTED_CONTEXTS[index],effects:{...UNEXPECTED_CONTEXTS[index].effects}};}
export function buildUnexpectedStep(session,context){return step(session,{phase:'unexpected_event',label:'LE MATCH CHANGE',progress:61,minute:session.moments?.[session.currentMoment]||57,title:context.title,text:context.text,actionLabel:'Continuer'});}
export function buildFullTimeStep(session,result){const contribution=result.goals>1?`${result.goals} buts`:result.goals===1?'1 but':'';const assist=result.assists>1?`${result.assists} passes décisives`:result.assists===1?'1 passe décisive':'';const impact=[contribution,assist].filter(Boolean).join(' et ');const finalDecision=session.events.at(-1)?.text||'';return step(session,{phase:'full_time_sequence',label:'FIN DE MATCH',progress:90,minute:90,title:'Les dernières minutes se jouent',text:`${finalDecision} ${session.opponent} jette ses dernières forces dans la bataille.${impact?` Ton match porte la trace de ${impact}.`:''}`.trim(),actionLabel:'Attendre le coup de sifflet'});}
export function buildFinalWhistleStep(session,result){const verdict=result.result==='win'?'La victoire est acquise.':result.result==='loss'?'La défaite est actée.':'Les deux équipes se quittent dos à dos.';return step(session,{phase:'final_whistle',label:'COUP DE SIFFLET',progress:97,minute:90,title:`${result.teamGoals} – ${result.opponentGoals}`,text:`${verdict} Pendant quelques secondes, le bruit du stade couvre tout le reste.`,actionLabel:'Voir les réactions'});}
export function buildPostMatchReactions(state,session,result){const coachName=state?.social?.coachData?.name||state?.social?.formativeCoach||'Le coach';const lockerText=result.result==='win'?(result.rating>=7.5?'Tes coéquipiers viennent te chercher dès l’entrée du vestiaire. Ton influence n’est passée inaperçue.':'Le vestiaire savoure le résultat, entre soulagement et fatigue.'):result.result==='loss'?'Le silence s’installe. Chacun rejoue mentalement les moments qui ont échappé à l’équipe.':'Le groupe reste partagé entre frustration et sentiment d’avoir résisté.';const coachText=result.rating>=8?`${coachName} te félicite devant le groupe, puis te rappelle que ce niveau crée de nouvelles attentes.`:result.rating<5.8?`${coachName} ne hausse pas le ton, mais son regard suffit : il attend une réaction au prochain match.`:`${coachName} souligne ton sérieux et pointe déjà le détail à corriger pour la suite.`;const mediaText=result.goals>=2?`Les premières alertes parlent déjà de ton ${result.goals===2?'doublé':result.goals===3?'triplé':result.goals===4?'quadruplé':`${result.goals} buts`}. Ton téléphone commence à vibrer.`:result.goals===1||result.assists>0?'Les médias retiennent ton influence directe sur le score.':result.rating>=7.5?'Les observateurs saluent une performance solide, même sans statistique décisive.':'Les commentaires se concentrent davantage sur le résultat collectif.';return[{id:'locker-room',icon:'👕',label:'VESTIAIRE',text:lockerText},{id:'coach',icon:'🧠',label:'COACH',text:coachText},{id:'media',icon:'🎙️',label:'MÉDIAS',text:mediaText}];}
export function buildReactionsStep(session,reactions){return step(session,{phase:'reactions',kind:'reactions',label:'APRÈS-MATCH',progress:100,title:'Le match continue hors du terrain',text:'Le score est figé, mais ses effets commencent seulement à se propager.',items:reactions,actionLabel:'Continuer la carrière'});}
export default {buildPreMatchStep,buildKickoffStep,buildDecisionStep,buildConsequenceStep,buildContinuationStep,createUnexpectedContext,buildUnexpectedStep,buildFullTimeStep,buildFinalWhistleStep,buildPostMatchReactions,buildReactionsStep};