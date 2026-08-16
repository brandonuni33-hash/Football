// Visualisation plein écran d'un match déjà simulé.
// Aucun input de déplacement, passe, tir ou dribble n'est exposé ici.
import { buildSimulatedMatchTimeline } from '../domain/match/simulatedMatchTimeline.js';
import { buildSimulatedMatchTacticalSituation } from '../domain/match/simulatedMatchTacticalSituation.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const scoreText=score=>`${Number(score?.home)||0} – ${Number(score?.away)||0}`;

const KIT_SETS=Object.freeze([
    Object.freeze({id:'red',own:'#e9f0ed',opponent:'#a7434d',ownGoalkeeper:'#2f9e8f',opponentGoalkeeper:'#e0a72f'}),
    Object.freeze({id:'blue',own:'#e9f0ed',opponent:'#2f5fb3',ownGoalkeeper:'#d9892b',opponentGoalkeeper:'#4ba36d'}),
    Object.freeze({id:'violet',own:'#e9f0ed',opponent:'#6f42c1',ownGoalkeeper:'#2f9e8f',opponentGoalkeeper:'#e0a72f'}),
    Object.freeze({id:'orange',own:'#e9f0ed',opponent:'#c56a1a',ownGoalkeeper:'#2d74c8',opponentGoalkeeper:'#4aa36b'}),
    Object.freeze({id:'navy',own:'#e9f0ed',opponent:'#243b64',ownGoalkeeper:'#d9892b',opponentGoalkeeper:'#45a17a'}),
    Object.freeze({id:'charcoal',own:'#e9f0ed',opponent:'#454b57',ownGoalkeeper:'#2f9e8f',opponentGoalkeeper:'#d99a2f'}),
    Object.freeze({id:'gold',own:'#e9f0ed',opponent:'#b58a16',ownGoalkeeper:'#2d74c8',opponentGoalkeeper:'#7b3fa1'})
]);
function hashString(seed='match'){let value=2166136261;for(const char of String(seed)){value^=char.charCodeAt(0);value=Math.imul(value,16777619);}return value>>>0;}
function kitsForMatch(seed='match'){return KIT_SETS[hashString(`${seed}:kits`)%KIT_SETS.length];}

function actorHtml(point,index,team,{playerSide='HOME',focal=null}={}){
    const role=esc(point.role||'outfield'),own=team.toUpperCase()===playerSide,isFocal=Boolean(focal&&focal.team===team.toUpperCase()&&Number(focal.index)===index);
    return `<span class="sim-match-actor ${own?'sim-match-own':'sim-match-opponent'}" data-sim-team="${team}" data-sim-index="${index}" data-role="${role}" data-player-focal="${isFocal?'true':'false'}" style="left:${point.x}%;top:${point.y}%;--facing:${Number(point.facing)||0}deg"></span>`;
}
function trajectoryHtml(trajectory){
    if(!trajectory?.from||!trajectory?.to)return'';
    return `<svg class="sim-ball-path" data-ball-path="true" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line class="sim-ball-path-line" x1="${trajectory.from.x}" y1="${trajectory.from.y}" x2="${trajectory.to.x}" y2="${trajectory.to.y}"></line>
        <circle class="sim-ball-path-target" cx="${trajectory.to.x}" cy="${trajectory.to.y}" r="1.1"></circle>
    </svg>`;
}
function ballHtml(ball){
    const trajectory=ball.trajectory||null,start=trajectory?.from||ball,target=trajectory?.to||ball,flight=Boolean(trajectory);
    return `${trajectoryHtml(trajectory)}<span class="sim-match-ball${flight?' sim-match-ball-flight':''}" data-ball-owner="${esc(ball.owner?`${ball.owner.team}:${ball.owner.index}`:'none')}" data-ball-flight="${flight?'true':'false'}" data-ball-target-x="${target.x}" data-ball-target-y="${target.y}" style="left:${start.x}%;top:${start.y}%;--ball-start-x:${start.x}%;--ball-start-y:${start.y}%;--ball-target-x:${target.x}%;--ball-target-y:${target.y}%;"></span>`;
}
function pitchHtml(tactical,playerSide,kits){
    const options={playerSide,focal:tactical.playerFocal},home=tactical.home.map((point,index)=>actorHtml(point,index,'home',options)).join(''),away=tactical.away.map((point,index)=>actorHtml(point,index,'away',options)).join('');
    return `<div class="sim-match-pitch" data-simulated-pitch data-own-formation="${esc(tactical.formations.own)}" data-opponent-formation="${esc(tactical.formations.opponent)}" data-player-position="${esc(tactical.playerFocal?.position||'')}" data-opponent-kit="${esc(kits.id)}" style="--own-kit:${kits.own};--opponent-kit:${kits.opponent};--own-goalkeeper-kit:${kits.ownGoalkeeper};--opponent-goalkeeper-kit:${kits.opponentGoalkeeper};">
        <i class="sim-pitch-halfway"></i><i class="sim-pitch-circle"></i>
        <i class="sim-pitch-box sim-pitch-box-left"></i><i class="sim-pitch-box sim-pitch-box-right"></i>
        <i class="sim-pitch-goal sim-pitch-goal-left"></i><i class="sim-pitch-goal sim-pitch-goal-right"></i>
        ${home}${away}${ballHtml(tactical.ball)}
    </div>`;
}

export class SimulatedMatchVisualizationController{
    constructor(){this.timeline=null;this.index=0;this.overlay=null;this.textTimer=null;this.textComplete=true;this.onComplete=null;this.playerPosition='BU';this.kits=KIT_SETS[0];}
    clearTextTimer(){if(this.textTimer)window.clearInterval(this.textTimer);this.textTimer=null;}
    clear(){this.clearTextTimer();this.overlay?.remove();this.overlay=null;this.timeline=null;this.index=0;this.textComplete=true;}
    show(match,{player={},seed=null,onComplete=null}={}){
        if(!match)return false;
        this.clear();
        this.playerPosition=player.position||match.playerPosition||match.fixture?.playerPosition||'BU';
        this.timeline=buildSimulatedMatchTimeline(match,{player,seed:seed||match.matchId||match.fixture?.id});
        this.kits=kitsForMatch(this.timeline.matchId);
        this.onComplete=onComplete;
        const overlay=document.createElement('div');
        overlay.className='simulated-match-overlay';overlay.dataset.simulatedMatchVisualization='true';overlay.dataset.playerPosition=this.playerPosition;overlay.dataset.opponentKit=this.kits.id;
        overlay.innerHTML=`<section class="simulated-match-shell" role="dialog" aria-modal="true" aria-label="Visualisation du match simulé">
            <header class="simulated-match-header">
                <div><small>${this.timeline.playerSide==='HOME'?'TON ÉQUIPE':'ADVERSAIRE'}</small><strong>${esc(this.timeline.homeTeam)}</strong></div>
                <div class="simulated-match-clock"><span data-sim-minute>0'</span><b data-sim-score>0 – 0</b></div>
                <div class="simulated-match-away"><small>${this.timeline.playerSide==='AWAY'?'TON ÉQUIPE':'ADVERSAIRE'}</small><strong>${esc(this.timeline.awayTeam)}</strong></div>
            </header>
            <div class="simulated-match-stage" data-sim-stage></div>
            <div class="simulated-match-progress" aria-hidden="true"><span data-sim-progress></span></div>
            <section class="simulated-match-copy" data-sim-copy tabindex="0" aria-live="polite">
                <span data-sim-label>MATCH</span><h2 data-sim-title>Le match commence</h2>
                <p data-sim-text data-text-complete="true"></p>
                <small class="simulated-match-hint">Touchez le texte pour l'afficher instantanément</small>
            </section>
            <button class="simulated-match-continue" type="button" data-sim-continue>Continuer</button>
        </section>`;
        (document.getElementById('app')||document.body).appendChild(overlay);this.overlay=overlay;
        overlay.querySelector('[data-sim-copy]')?.addEventListener('click',()=>this.revealImmediately());
        overlay.querySelector('[data-sim-copy]')?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();this.revealImmediately();}});
        overlay.querySelector('[data-sim-continue]')?.addEventListener('click',()=>this.advance());this.renderCurrent();return true;
    }
    renderCurrent(){
        const event=this.timeline?.events?.[this.index];if(!event||!this.overlay)return;
        const tactical=buildSimulatedMatchTacticalSituation(event,{playerAge:this.timeline.playerAge,competition:this.timeline.competition,seed:this.timeline.matchId,playerSide:this.timeline.playerSide,playerPosition:this.playerPosition});
        const stage=this.overlay.querySelector('[data-sim-stage]');if(stage)stage.innerHTML=pitchHtml(tactical,this.timeline.playerSide,this.kits);
        this.overlay.dataset.eventType=event.type;this.overlay.dataset.cameraState=event.cameraState;this.overlay.dataset.tacticalLevel=tactical.organization.level;this.overlay.dataset.playerSide=this.timeline.playerSide;this.overlay.dataset.ownFormation=tactical.formations.own;this.overlay.dataset.opponentFormation=tactical.formations.opponent;this.overlay.dataset.opponentKit=this.kits.id;
        const minute=this.overlay.querySelector('[data-sim-minute]'),score=this.overlay.querySelector('[data-sim-score]'),label=this.overlay.querySelector('[data-sim-label]'),title=this.overlay.querySelector('[data-sim-title]'),progress=this.overlay.querySelector('[data-sim-progress]'),button=this.overlay.querySelector('[data-sim-continue]');
        if(minute)minute.textContent=event.minuteLabel;if(score)score.textContent=scoreText(event.score);if(label)label.textContent=event.type==='GOAL'?'BUT':event.type==='FULL_TIME'?'FIN DU MATCH':'MATCH EN COURS';if(title)title.textContent=this.titleFor(event);if(progress)progress.style.width=`${Math.round(((this.index+1)/this.timeline.events.length)*100)}%`;if(button)button.textContent=this.index===this.timeline.events.length-1?'Terminer':'Continuer';this.revealProgressively(event.text||'');
    }
    titleFor(event){const titles={KICKOFF:"Coup d'envoi",BUILD_UP:'La construction prend forme',PRESSING:'Le pressing resserre le jeu',DUEL:'Le duel se rapproche',COUNTER_ATTACK:'La transition accélère',CROSS:"Le jeu s'ouvre sur un côté",SHOT:'Une fenêtre de frappe',SET_PIECE:'Coup de pied arrêté',GOAL:'Le score change',FULL_TIME:'Coup de sifflet final'};return titles[event.type]||'Le match continue';}
    revealProgressively(text){this.clearTextTimer();const node=this.overlay?.querySelector('[data-sim-text]');if(!node)return;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true,parts=String(text).split(/(\s+)/).filter(Boolean);if(reduced||parts.length<=2){node.textContent=text;node.dataset.textComplete='true';this.textComplete=true;return;}node.textContent='';node.dataset.textComplete='false';this.textComplete=false;let cursor=0;this.textTimer=window.setInterval(()=>{node.textContent+=parts[cursor++]||'';if(cursor>=parts.length){this.clearTextTimer();node.dataset.textComplete='true';this.textComplete=true;}},28);}
    revealImmediately(){if(this.textComplete)return false;const event=this.timeline?.events?.[this.index],node=this.overlay?.querySelector('[data-sim-text]');if(!event||!node)return false;this.clearTextTimer();node.textContent=event.text||'';node.dataset.textComplete='true';this.textComplete=true;return true;}
    advance(){if(!this.textComplete){this.revealImmediately();return;}if(!this.timeline||this.index>=this.timeline.events.length-1){const callback=this.onComplete;this.clear();callback?.();return;}this.index+=1;this.renderCurrent();}
}
export default SimulatedMatchVisualizationController;
