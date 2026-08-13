// Présentation de la séquence de match jouable. Toute la logique reste dans le domaine match.
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
function legacyStep(result={}){const decision=result.interactiveDecision;if(!decision)return null;return{phase:'moment_1',kind:'decision',label:'MOMENT CLÉ',progress:40,minute:decision.minute,title:decision.title,text:decision.description,choices:decision.choices||[],items:[],score:{home:0,away:0},team:'Ton équipe',opponent:'Adversaire',home:true};}
function phaseTone(step={}){if(step.kind==='decision')return'decision';if(step.kind==='reactions')return'reactions';if(step.phase==='unexpected_event')return'unexpected';if(step.phase==='final_whistle')return'final';return'narration';}
function mediaUnlocked(state={}){const player=state.player||{},media=state.media||{},stats=player.stats||{};if(media.proCoverageUnlocked===true)return true;const explicit=Number(stats.professionalMatches??stats.proMatches);if(Number.isFinite(explicit))return explicit>0;const squad=String(player.squadStatus||'').toLowerCase(),stage=String(player.careerStage||player.stage||'').toLowerCase(),age=Number(player.age||0);const youth=age>0&&age<19||squad.includes('formation')||squad.includes('academy')||squad.includes('jeune')||stage.includes('youth')||stage.includes('formation');return !youth&&Number(stats.matchesPlayed||0)>0;}
function visibleReactionItems(items=[],state={}){if(mediaUnlocked(state))return items;return items.filter(item=>!['médias','media'].includes(String(item?.label||item?.id||'').toLowerCase()));}
function attendanceHtml(info){if(!info?.label)return'';return`<aside class="interactive-match-attendance" aria-label="Affluence"><strong>${escapeHtml(info.label)}</strong><p>${escapeHtml(info.context||'')}</p></aside>`;}
function innerVoiceHtml(text){if(!text)return'';return`<p class="interactive-match-inner-voice">${escapeHtml(text)}</p>`;}

const PRO_COMPETITION=/ligue\s?[12]|premier league|championship|la liga|serie a|bundesliga|eredivisie|primeira|champions league|europa league|conference league|coupe de france|fa cup|copa del rey|coppa italia|dfb|\bsenior\b|\bnational\b/i;
const YOUTH_COMPETITION=/\bu\s?(?:15|16|17|18|19|20|21|23)\b|youth|jeune|academy|acad[eé]mie|formation|r[eé]serve|espoirs?/i;

export function matchPresentationTier(state={},step={}){
    const player=state.player||{},age=Number(player.age||0);
    const competition=String(step.competition||'');
    const context=[competition,player.careerStage,player.stage,player.squadStatus,player.contract?.type].filter(Boolean).join(' ');
    if(/\bu\s?15\b|moins de 15/i.test(context))return'u15';
    if(YOUTH_COMPETITION.test(context))return age>0&&age<=15?'u15':'youth';
    if(PRO_COMPETITION.test(competition)||/professional|professionnel|\bpro\b|first.?team|premi[eè]re.?[eé]quipe|\bsenior\b/i.test(context))return'pro';
    if(age>0&&age<=15)return'u15';
    if(age>0&&age<=18)return'youth';
    return'adult';
}

function positionGroup(state={}){const p=String(state.player?.position||state.player?.positionId||'').toUpperCase();if(['GK','GB','G'].includes(p))return'goalkeeper';if(['DC','CB','DD','RB','DG','LB','D'].includes(p))return'defender';if(['MC','CM','MOC','CAM','MDC','CDM','MD','MG','M'].includes(p))return'midfielder';if(['AG','LW','AD','RW'].includes(p))return'winger';return'attacker';}
function simplifyFootballWords(value=''){
    return String(value||'')
        .replace(/demi[- ]espace/gi,'zone intérieure')
        .replace(/entre les lignes/gi,'dans l’espace')
        .replace(/rapport de force/gi,'duel')
        .replace(/profondeur/gi,'dos de la défense')
        .replace(/pivoter/gi,'se retourner')
        .replace(/décroches/gi,'viens chercher le ballon')
        .replace(/décrocher/gi,'venir chercher le ballon')
        .replace(/fixer/gi,'attirer')
        .replace(/coulisser/gi,'se replacer')
        .replace(/coulisses/gi,'te replaces')
        .replace(/premier rideau/gi,'premiers adversaires')
        .replace(/casser une ligne/gi,'faire avancer le ballon')
        .replace(/bloc adverse/gi,'équipe adverse')
        .replace(/ton bloc/gi,'ton équipe')
        .replace(/le bloc/gi,'l’équipe');
}
function compactText(value,maxWords=26,maxSentences=2){const clean=simplifyFootballWords(value).replace(/\s+/g,' ').trim();if(!clean)return'';const sentences=clean.match(/[^.!?]+[.!?]?/g)||[clean],joined=sentences.slice(0,maxSentences).join(' ').trim(),words=joined.split(/\s+/);if(words.length<=maxWords)return joined;return`${words.slice(0,maxWords).join(' ').replace(/[,:;]$/,'')}…`;}
function stripMinuteTitle(value=''){return String(value||'').replace(/^\s*\d{1,3}'\s*[·:\-–—]\s*/,'').trim();}
function scoreFor(step={}){return Number(step.score?.[step.home===false?'away':'home'])||0;}
function scoreAgainst(step={}){return Number(step.score?.[step.home===false?'home':'away'])||0;}

function u15DecisionTitle(state={},step={}){
    const all=`${step.title||''} ${step.text||''} ${(step.choices||[]).map(choice=>choice.text||choice.texte||choice.label||'').join(' ')}`.toLowerCase();
    if(/penalty|point de penalty/.test(all))return'Ton penalty';
    if(/appel|dans son dos|dos de la défense/.test(all))return'Un espace dans son dos';
    if(/frapp|tir|finition/.test(all)||/occasion de but/i.test(step.label||''))return'Tu peux tenter ta chance';
    if(/centre|surface/.test(all))return'Le ballon peut partir';
    if(/protéger|contact|te colle/.test(all))return'Il te colle';
    if(/dribb|élimin|provoqu|duel|latéral/.test(all))return'Face à ton défenseur';
    if(/press|moins de temps/.test(all))return'Tu as peu de temps';
    const group=positionGroup(state);
    return group==='goalkeeper'?'La relance arrive':group==='defender'?'À toi de défendre':group==='midfielder'?'Le ballon arrive':group==='winger'?'À toi sur le côté':'Dos au défenseur';
}
function u15DecisionPrompt(state={},step={}){
    const all=`${step.title||''} ${step.text||''} ${(step.choices||[]).map(choice=>choice.text||choice.texte||choice.label||'').join(' ')}`.toLowerCase();
    if(/penalty|point de penalty/.test(all))return'Tu poses le ballon. Le gardien attend ton choix.';
    if(/frapp|tir|finition/.test(all)||/occasion de but/i.test(step.label||'')){const short=compactText(step.text,24,2);return short||'Le but est devant toi. Tu dois choisir vite.';}
    const group=positionGroup(state);
    if(group==='goalkeeper')return'Le ballon revient vers toi. Le pressing arrive.';
    if(group==='defender')return'Ton adversaire reçoit près de ta zone. Tu dois choisir comment défendre.';
    if(group==='midfielder')return'Le ballon arrive sous pression. Tu as peu de temps pour jouer.';
    if(group==='winger')return'Tu reçois près de la ligne. Ton défenseur est face à toi.';
    return'Tu reçois avec le défenseur tout près. Un partenaire bouge devant toi.';
}
function u15FlowText(state={},step={}){const group=positionGroup(state),forGoals=scoreFor(step),against=scoreAgainst(step),scoreLine=forGoals>against?'Ton équipe mène. ':forGoals<against?'Ton équipe doit revenir. ':'';const role=group==='goalkeeper'?'Tu restes prêt derrière ta défense.':group==='defender'?'Tu restes proche de ton adversaire et tu te replaces.':group==='midfielder'?'Le jeu revient au milieu. Tu te replaces et tu redemandes le ballon.':group==='winger'?'Tu restes disponible sur le côté et tu attends le prochain ballon.':'Tu restes près des défenseurs et tu attends le prochain ballon.';return`${scoreLine}${role}`.trim();}
function u15Unexpected(step={}){const source=`${step.title||''} ${step.text||''}`.toLowerCase();if(/press/.test(source))return{title:'Ils viennent plus vite',text:'À chaque ballon, un adversaire arrive plus vite sur toi.'};if(/espace/.test(source))return{title:'Il y a plus d’espace',text:'Le terrain s’ouvre un peu. Tu peux avancer plus facilement.'};if(/tension|arbit|parents|public/.test(source))return{title:'Ça chauffe un peu',text:'Ça parle autour du terrain. Ton coach te demande de rester concentré.'};if(/coach|consigne/.test(source))return{title:'Le coach te parle',text:'Il te donne une consigne simple pour le prochain ballon.'};if(/adversaire direct|vis-à-vis|défend/.test(source))return{title:'Il change sa façon de défendre',text:'Ton adversaire te laisse moins d’espace qu’au début.'};if(/ralent|temps faible/.test(source))return{title:'Le match ralentit',text:'Le ballon circule moins vite. Tu te replaces et tu restes disponible.'};return{title:stripMinuteTitle(step.title)||'Le match change',text:compactText(step.text,22,2)};}
function u15ConsequenceTitle(step={}){const source=`${step.title||''} ${step.text||''}`.toLowerCase();if(/referme|lit ton geste|récupère|perd|rat|hésit|ne passe pas|trop long/.test(source))return'Ça ne passe pas';if(/ouvre|gagne|retard|tourne pour toi|réussi|fonctionne/.test(source))return'Ça marche';return'L’action continue';}

function choiceIntent(choice={}){
    const raw=String(choice.text||choice.texte||choice.label||'Choisir'),lower=raw.toLowerCase();
    const patterns=[
        {re:/appel.*dos|dans son dos|profondeur/,icon:'↗',title:'Partir dans son dos',subtitle:'Attaquer l’espace',tone:'attack'},
        {re:/décroch|attir.*repart|emmener.*zone/,icon:'↩',title:'L’attirer vers toi',subtitle:'Puis repartir',tone:'smart'},
        {re:/protéger|contact|garder.*ballon/,icon:'◆',title:'Protéger le ballon',subtitle:'Et jouer simple',tone:'control'},
        {re:/frapp|tirer|finition|volée|panenka/,icon:'◎',title:'Frapper',subtitle:'Tenter ta chance',tone:'attack'},
        {re:/centre|centrer/,icon:'↗',title:'Centrer',subtitle:'Chercher un partenaire',tone:'collective'},
        {re:/une-deux|passe|servir|décaler|donner|remettre|une touche/,icon:'⇄',title:'Jouer avec un partenaire',subtitle:'Faire avancer l’action',tone:'collective'},
        {re:/dribb|élimin|provoqu|petit pont|feint/,icon:'⚡',title:'Le provoquer',subtitle:'Tenter de passer',tone:'duel'},
        {re:/ligne|déborder|couloir/,icon:'→',title:'Prendre le côté',subtitle:'Accélérer',tone:'attack'},
        {re:/couper|intercept|sortir fort/,icon:'✦',title:'Couper l’action',subtitle:'Lire le jeu',tone:'defend'},
        {re:/temporis|attendre|patienter/,icon:'◌',title:'Patienter',subtitle:'Attendre le bon moment',tone:'control'},
        {re:/revenir|jouer derrière|simple/,icon:'↩',title:'Jouer simple',subtitle:'Garder le ballon',tone:'control'}
    ];
    return{raw,...(patterns.find(item=>item.re.test(lower))||{icon:'◆',title:raw,subtitle:'Faire ton choix',tone:'neutral'})};
}
export function choicePresentation(choice={},tier='adult'){
    const intent=choiceIntent(choice),canonical=intent.raw,gesture=String(choice.gesture||'').trim();
    if(tier==='u15')return{...choice,displayTitle:intent.title,displaySubtitle:intent.subtitle,displayIcon:intent.icon,displayTone:intent.tone};
    if(tier==='youth')return{...choice,displayTitle:intent.title,displaySubtitle:gesture&&gesture!==canonical?gesture:intent.subtitle,displayIcon:intent.icon,displayTone:intent.tone};
    return{...choice,displayTitle:canonical,displaySubtitle:gesture&&gesture!==canonical?gesture:intent.subtitle,displayIcon:intent.icon,displayTone:intent.tone};
}

export function ageAppropriateMatchPresentation(step={},state={}){
    if(!step)return step;
    const tier=matchPresentationTier(state,step),presented={...step,choices:(step.choices||[]).map(choice=>choicePresentation(choice,tier)),presentationTier:tier};
    if(tier==='u15'){
        if(step.kind==='decision'){
            presented.label='À TOI';
            presented.title=u15DecisionTitle(state,step);
            presented.text=u15DecisionPrompt(state,step);
            presented.innerVoice=step.innerVoice?compactText(step.innerVoice,10,1):null;
        }else if(step.phase==='match_continues'){
            presented.title='Le jeu continue';
            presented.text=u15FlowText(state,step);
            presented.innerVoice=null;
        }else if(step.phase==='unexpected_event'){
            const simple=u15Unexpected(step);presented.title=simple.title;presented.text=simple.text;presented.innerVoice=null;
        }else if(step.phase==='kickoff'){
            presented.title='Le match commence';presented.text='Les premiers duels arrivent. Ton coach te demande surtout de jouer simple.';presented.innerVoice=null;
        }else if(String(step.phase||'').startsWith('consequence')){
            presented.title=u15ConsequenceTitle(step);presented.text=compactText(step.text,24,2);presented.innerVoice=step.innerVoice?compactText(step.innerVoice,10,1):null;
        }else if(step.phase==='pre_match'){
            presented.text=compactText(step.text,28,2);
        }
        return presented;
    }
    if(tier==='youth'){
        if(step.kind==='decision'){
            const title=stripMinuteTitle(step.title).replace(/Ton duel commence vraiment/i,'Le duel se précise').replace(/Le rapport de force a changé/i,'Le match change');
            presented.title=title||'À toi de jouer';presented.text=compactText(step.text,38,2);presented.innerVoice=step.innerVoice?compactText(step.innerVoice,14,1):null;
        }else if(['match_continues','unexpected_event'].includes(step.phase)||String(step.phase||'').startsWith('consequence')){
            presented.text=compactText(step.text,40,2);
        }
    }
    return presented;
}

function choiceHtml(choice,index){const title=choice.displayTitle||choice.text||choice.texte||choice.label||'Choisir',subtitle=choice.displaySubtitle||(choice.gesture&&choice.text!==choice.gesture?choice.gesture:''),icon=choice.displayIcon||'◆',tone=choice.displayTone||'neutral';return`<button type="button" data-interactive-choice="${index}" data-choice-tone="${escapeHtml(tone)}"><span class="interactive-match-choice-icon" aria-hidden="true">${escapeHtml(icon)}</span><span class="interactive-match-choice-copy"><strong>${escapeHtml(title)}</strong>${subtitle?`<small>${escapeHtml(subtitle)}</small>`:''}</span><span class="interactive-match-choice-index" aria-hidden="true">${index+1}</span></button>`;}

export class InteractiveMatchFlowController{
constructor({ui,onResult}={}){this.ui=ui;this.onResult=onResult;this.timer=null;this.countdown=null;this.advancing=false;}
clear(){if(this.timer)window.clearTimeout(this.timer);if(this.countdown)window.clearInterval(this.countdown);this.timer=null;this.countdown=null;document.querySelector('[data-interactive-match-flow]')?.remove();}
show(result={}){const rawStep=result.interactiveStep||legacyStep(result);if(!rawStep)return false;this.clear();this.advancing=false;const state=this.ui?.gateway?.state||{},step=ageAppropriateMatchPresentation(rawStep,state),overlay=document.createElement('div'),homeTeam=step.home===false?step.opponent:step.team,awayTeam=step.home===false?step.team:step.opponent,choices=step.choices||[],items=visibleReactionItems(step.items||[],state),minute=step.minute===null||step.minute===undefined?'—':`${step.minute}'`,timed=step.kind==='decision'&&Number(step.timedDecision?.seconds)>0;overlay.className=`interactive-match-overlay tone-${phaseTone(step)}`;overlay.dataset.interactiveMatchFlow='true';overlay.dataset.interactivePhase=step.phase||'unknown';overlay.dataset.matchTier=step.presentationTier||'adult';overlay.innerHTML=`<section class="interactive-match-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(step.title||'Match jouable')}"><header class="interactive-match-header"><div><span class="interactive-match-kicker">${escapeHtml(step.label||'MATCH')}</span><strong>${escapeHtml(step.competition||'Match jouable')}</strong></div><span class="interactive-match-minute">${escapeHtml(minute)}</span></header><div class="interactive-match-scoreboard" aria-label="Score ${escapeHtml(step.score?.home||0)} à ${escapeHtml(step.score?.away||0)}"><span>${escapeHtml(homeTeam||'Domicile')}</span><strong><b>${escapeHtml(step.score?.home||0)}</b><i>–</i><b>${escapeHtml(step.score?.away||0)}</b></strong><span>${escapeHtml(awayTeam||'Extérieur')}</span></div><div class="interactive-match-progress" aria-hidden="true"><span style="width:${Math.max(2,Math.min(100,Number(step.progress)||0))}%"></span></div>${attendanceHtml(step.attendanceInfo)}<div class="interactive-match-story"><span class="interactive-match-phase-icon">${step.kind==='decision'?'◆':step.kind==='reactions'?'◎':step.phase==='unexpected_event'?'!':'●'}</span><h2>${escapeHtml(step.title||'Le match continue')}</h2><p>${escapeHtml(step.text||'')}</p>${innerVoiceHtml(step.innerVoice)}${timed?`<div class="interactive-match-pressure" aria-live="polite">⏱ <strong data-pressure-countdown>${Number(step.timedDecision.seconds)}</strong>s · décide maintenant</div>`:''}</div>${items.length?`<div class="interactive-match-reactions">${items.map(item=>`<article><span>${escapeHtml(item.icon||'•')}</span><div><strong>${escapeHtml(item.label||'RÉACTION')}</strong><p>${escapeHtml(item.text||'')}</p></div></article>`).join('')}</div>`:''}${choices.length?`<div class="interactive-match-choices">${choices.map(choiceHtml).join('')}</div>`:`<button class="interactive-match-continue" type="button" data-interactive-continue>${escapeHtml(step.actionLabel||'Continuer')}</button>`}</section>`;(document.getElementById('app')||document.body).appendChild(overlay);overlay.querySelectorAll('[data-interactive-choice]').forEach(button=>button.addEventListener('click',()=>this.advance(Number(button.dataset.interactiveChoice))));overlay.querySelector('[data-interactive-continue]')?.addEventListener('click',()=>this.advance(null));if(timed){let remaining=Math.max(1,Math.round(Number(step.timedDecision.seconds))),node=overlay.querySelector('[data-pressure-countdown]');this.countdown=window.setInterval(()=>{remaining-=1;if(node)node.textContent=String(Math.max(0,remaining));if(remaining<=0){window.clearInterval(this.countdown);this.countdown=null;}},1000);this.timer=window.setTimeout(()=>this.advanceTimeout(),remaining*1000);}return true;}
advanceTimeout(){if(this.advancing)return;this.advancing=true;this.clear();try{const next=this.ui?.gateway?.playNextBlock({timedOut:true});this.onResult?.(next);}catch(error){this.advancing=false;throw error;}}
advance(choiceIndex){if(this.advancing)return;this.advancing=true;this.clear();try{const next=this.ui?.gateway?.playNextBlock(choiceIndex);this.onResult?.(next);}catch(error){this.advancing=false;throw error;}}
}
export default InteractiveMatchFlowController;
