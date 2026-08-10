// UI du vrai match interactif : chaque rencontre est jouée séparément.
import { UserInterface } from './ui.js';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

function styles(){
    if(document.getElementById('stp-interactive-match-css')) return;
    const s=document.createElement('style'); s.id='stp-interactive-match-css'; s.textContent=`
    .stp-im-overlay{position:fixed;inset:0;z-index:12000;background:rgba(2,6,23,.78);backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center;padding:10px;box-sizing:border-box}
    .stp-im-card{width:min(100%,430px);max-height:94dvh;overflow:auto;border:1px solid rgba(255,255,255,.11);border-radius:24px 24px 18px 18px;background:linear-gradient(180deg,#101a2c,#070d19);box-shadow:0 25px 70px rgba(0,0,0,.55);padding:16px;color:#f8fafc}
    .stp-im-kicker{text-align:center;color:#64748b;font-size:.58rem;font-weight:850;text-transform:uppercase;letter-spacing:.09em}.stp-im-title{text-align:center;font-size:1.05rem;font-weight:900;margin:5px 0 2px}.stp-im-sub{text-align:center;color:#94a3b8;font-size:.63rem;margin-bottom:12px}
    .stp-im-score{display:grid;grid-template-columns:1fr 54px 1fr;align-items:center;gap:7px;padding:12px 6px;border-radius:15px;background:rgba(255,255,255,.045);margin-bottom:12px}.stp-im-team{text-align:center;font-size:.68rem;font-weight:850;line-height:1.2}.stp-im-scorebox{text-align:center;font-size:1.2rem;font-weight:950}.stp-im-scorebox small{display:block;color:#64748b;font-size:.52rem;margin-top:1px}.stp-im-context{padding:10px;border-left:2px solid rgba(52,211,153,.45);border-radius:8px;background:rgba(255,255,255,.035);color:#cbd5e1;font-size:.64rem;line-height:1.4;margin-bottom:10px}.stp-im-event{display:flex;gap:7px;align-items:center;padding:7px 8px;border-radius:9px;background:rgba(255,255,255,.03);font-size:.58rem;color:#94a3b8;margin-bottom:5px}.stp-im-event b{color:#64748b;min-width:25px}.stp-im-choices{display:grid;gap:7px;margin-top:10px}.stp-im-choice{width:100%;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.045);color:#f8fafc;padding:10px;text-align:left;cursor:pointer;touch-action:manipulation}.stp-im-choice strong{display:block;font-size:.68rem;line-height:1.3}.stp-im-choice span{display:block;margin-top:3px;color:#7f8da2;font-size:.55rem}.stp-im-choice:active{transform:scale(.985);background:rgba(52,211,153,.08)}.stp-im-result{text-align:center;padding:12px;border-radius:14px;background:rgba(255,255,255,.045);margin-top:9px}.stp-im-result-score{font-size:1.6rem;font-weight:950}.stp-im-result-meta{color:#aeb9ca;font-size:.6rem;margin-top:4px}.stp-im-next{width:100%;border:0;border-radius:11px;background:#34d399;color:#052b1d;padding:11px;margin-top:10px;font-size:.67rem;font-weight:900;cursor:pointer;touch-action:manipulation}
    `; document.head.appendChild(s);
}
function close(){document.getElementById('stp-interactive-match')?.remove();}
function mount(html){styles(); const app=document.getElementById('app'); if(!app) return null; close(); app.insertAdjacentHTML('beforeend',`<div class="stp-im-overlay" id="stp-interactive-match"><div class="stp-im-card">${html}</div></div>`); return document.getElementById('stp-interactive-match');}

UserInterface.prototype.startInteractiveMatchFlow=function(){
    if(this._interactiveFlowRunning) return;
    const state=this.engine?.state; if(!state?.player) return;
    const matches=this.engine.getScheduledMatches?.()||[];
    if(!matches.length){ this.playBlockSafely(null,true); return; }
    this._interactiveFlowRunning=true; this._interactiveMatches=matches; this._interactiveResults=[]; this._interactiveIndex=0;
    this._showInteractiveMatch(0);
};

UserInterface.prototype._showInteractiveMatch=function(index){
    const match=this._interactiveMatches?.[index];
    if(!match){ this._finishInteractiveFlow(); return; }
    const session=this.engine.startInteractiveMatch(match,index);
    this._activeInteractiveSession=session;
    this._showInteractiveDecision(session);
};

UserInterface.prototype._showInteractiveDecision=function(session){
    const match=session.match||{}; const decision=session.decision; if(!decision) return;
    const events=(session.events||[]).slice(-3).map(e=>`<div class="stp-im-event"><b>${esc(e.minute)}'</b><span>${esc(e.icon||'•')} ${esc(e.text)}</span></div>`).join('');
    const choices=(decision.choices||[]).map((c,i)=>`<button class="stp-im-choice" data-im-choice="${i}"><strong>${esc(c.text||c.texte||c.label||`Choix ${i+1}`)}</strong><span>La conséquence sera déterminée par le contexte du match.</span></button>`).join('');
    const home=session.home, playerClub=this.engine.state.player.club||'Ton équipe';
    mount(`<div class="stp-im-kicker">${esc(session.competition)} · ${esc(session.importance)} · Match ${session.matchIndex+1}/${this._interactiveMatches.length}</div><div class="stp-im-title">${esc(decision.title||'Moment clé')}</div><div class="stp-im-sub">${esc(decision.phase||'Match')} · ${esc(decision.minute)}'</div><div class="stp-im-score"><div class="stp-im-team">${esc(playerClub)}</div><div class="stp-im-scorebox">${session.score?.home||0}–${session.score?.away||0}<small>score</small></div><div class="stp-im-team">${esc(session.opponent)}</div></div>${events}<div class="stp-im-context">${esc(decision.description||'Le match se joue maintenant. Quelle décision prends-tu ?')}</div><div class="stp-im-choices">${choices}</div>`);
    document.querySelectorAll('[data-im-choice]').forEach(btn=>btn.addEventListener('click',()=>{
        document.querySelectorAll('[data-im-choice]').forEach(b=>b.disabled=true);
        const result=this.engine.resolveInteractiveMatchDecision(Number(btn.dataset.imChoice));
        if(result.finished) this._showInteractiveResult(result.result,index=>this._afterInteractiveMatch(index));
        else this._showInteractiveDecision(result.session);
    },{once:true}));
};

UserInterface.prototype._showInteractiveResult=function(result,next){
    const home=result.home; const score=`${result.score?.home??0}–${result.score?.away??0}`; const meta=[`Note ${Number(result.rating||0).toFixed(1)}`,`${result.goals||0} but`,`${result.assists||0} passe D.`].join(' · ');
    mount(`<div class="stp-im-kicker">Match terminé</div><div class="stp-im-title">${esc(result.competitionName||'Match')}</div><div class="stp-im-sub">${esc(result.opponent||'Adversaire')}</div><div class="stp-im-result"><div class="stp-im-result-score">${score}</div><div class="stp-im-result-meta">${esc(meta)}</div></div><button class="stp-im-next" id="stp-im-next">Continuer</button>`);
    document.getElementById('stp-im-next')?.addEventListener('click',()=>next(this._interactiveIndex),{once:true});
};

UserInterface.prototype._afterInteractiveMatch=function(index){
    this._interactiveIndex=index+1;
    if(this._interactiveIndex<this._interactiveMatches.length) this._showInteractiveMatch(this._interactiveIndex);
    else this._finishInteractiveFlow();
};

UserInterface.prototype._finishInteractiveFlow=function(){
    try{
        const result=this.engine.completeInteractiveBlock?.();
        close(); this._interactiveFlowRunning=false;
        this._interactiveMatches=null; this._interactiveResults=null; this._interactiveIndex=0;
        if(result){ this.notice=result.event?'Un événement demande ton attention.':result.coachEvent?'Ton entraîneur souhaite te parler.':null; this.renderDashboard?.(); }
        else this.renderDashboard?.();
    }catch(error){console.error('[Interactive Match]',error);close();this._interactiveFlowRunning=false;this.notice=`Le bloc n’a pas pu être terminé : ${error?.message||'erreur inconnue'}`;this.renderDashboard?.();}
};

// Le bouton AVANCER lance désormais le vrai match interactif lorsqu'un match existe.
const previousPlayBlockSafely=UserInterface.prototype.playBlockSafely;
UserInterface.prototype.playBlockSafely=function(choice=null,fromMatchSession=false){
    if(!fromMatchSession && !choice && !this._interactiveFlowRunning && this.engine?.state?.player){
        const matches=this.engine.getScheduledMatches?.()||[];
        if(matches.length){this.startInteractiveMatchFlow();return;}
    }
    return previousPlayBlockSafely?.call(this,choice,fromMatchSession);
};
