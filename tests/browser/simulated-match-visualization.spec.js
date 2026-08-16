import { test, expect } from '@playwright/test';

const match={matchId:'visual-mobile',matchIndex:0,home:true,team:'Blagnac U15',opponent:'Lens U15',competitionName:'U15',score:{home:2,away:1},goals:1,assists:0,shots:3,shotsOnTarget:2,duels:4,tackles:1,successfulPasses:18,playerPlayed:true};

for(const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932}]){
 test(`terrain simulé cadré en ${viewport.width}x${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('/index.html');
  const result=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');new Controller().show(match,{player:{age:14,club:'Blagnac U15',position:'BU'},seed:'mobile'});const pitch=document.querySelector('[data-simulated-pitch]'),rect=pitch.getBoundingClientRect();return{left:rect.left,right:rect.right,width:rect.width,height:rect.height,actors:document.querySelectorAll('.sim-match-actor').length,own:document.querySelectorAll('.sim-match-own').length,opponents:document.querySelectorAll('.sim-match-opponent').length,balls:document.querySelectorAll('.sim-match-ball').length,choices:document.querySelectorAll('[data-interactive-choice]').length};},match);
  expect(result.left).toBeGreaterThanOrEqual(-1);expect(result.right).toBeLessThanOrEqual(viewport.width+1);expect(result.width).toBeGreaterThan(280);expect(result.height).toBeGreaterThan(180);expect(result.actors).toBe(22);expect(result.own).toBe(11);expect(result.opponents).toBe(11);expect(result.balls).toBe(1);expect(result.choices).toBe(0);
 });
}

test('l identité visuelle de l équipe du joueur ne change jamais pendant le match',async({page})=>{
 await page.goto('/index.html');
 const result=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');const controller=new Controller();controller.show(match,{player:{age:14,club:'Blagnac U15',position:'BU'},seed:'identity'});const frames=[];for(let index=0;index<controller.timeline.events.length;index+=1){controller.index=index;controller.renderCurrent();const focal=document.querySelector('[data-player-focal="true"]');frames.push({own:document.querySelectorAll('.sim-match-own').length,opponents:document.querySelectorAll('.sim-match-opponent').length,focalOwn:focal?focal.classList.contains('sim-match-own'):false,owner:document.querySelector('.sim-match-ball')?.dataset.ballOwner||'',opponentKit:document.querySelector('[data-simulated-pitch]')?.dataset.opponentKit||''});}return frames;},match);
 expect(result.length).toBeGreaterThan(3);const kit=result[0].opponentKit;for(const frame of result){expect(frame.own).toBe(11);expect(frame.opponents).toBe(11);expect(frame.focalOwn).toBe(true);expect(frame.owner).not.toBe('none');expect(frame.opponentKit).toBe(kit);}
});

test('le joueur de référence suit le poste sélectionné',async({page})=>{
 await page.goto('/index.html');
 const result=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');const controller=new Controller();controller.show(match,{player:{age:14,club:'Blagnac U15',position:'BU'},seed:'position-browser'});const bu=document.querySelector('[data-player-focal="true"]');const first={index:Number(bu?.dataset.simIndex),position:document.querySelector('[data-simulated-pitch]')?.dataset.playerPosition,formation:document.querySelector('[data-simulated-pitch]')?.dataset.ownFormation};controller.show(match,{player:{age:14,club:'Blagnac U15',position:'DC'},seed:'position-browser'});const dc=document.querySelector('[data-player-focal="true"]');return{first,second:{index:Number(dc?.dataset.simIndex),position:document.querySelector('[data-simulated-pitch]')?.dataset.playerPosition,formation:document.querySelector('[data-simulated-pitch]')?.dataset.ownFormation}};},match);
 expect(result.first.position).toBe('BU');expect(result.second.position).toBe('DC');expect(result.first.formation).toBe(result.second.formation);expect(result.first.index).not.toBe(result.second.index);
});

test('un AD reste ailier droit après la mi-temps',async({page})=>{
 await page.goto('/index.html');
 const result=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');const controller=new Controller();controller.show(match,{player:{age:25,club:'Blagnac U15',position:'AD'},seed:'wing-browser'});const makeEvent=(period,minute,x)=>({id:`wing-${period}`,matchId:'visual-mobile',type:'BUILD_UP',cameraState:'BUILD_UP',clock:{period,regulationMinute:minute,stoppageMinute:0},minuteLabel:`${minute}'`,possessionSide:'HOME',zone:{x,y:50,lane:'CENTER',third:'MIDDLE'},ballCarrier:{team:'HOME',index:6,role:'midfielder'},playerContribution:'NONE',playerInvolved:false,score:{home:0,away:0},text:'Construction.'});controller.timeline={...controller.timeline,playerAge:25,competition:'Ligue 1',events:[makeEvent('FIRST_HALF',20,34),makeEvent('SECOND_HALF',60,66)]};const ys=[];for(let i=0;i<2;i+=1){controller.index=i;controller.renderCurrent();const focal=document.querySelector('[data-player-focal="true"]');ys.push(parseFloat(focal?.style.top||'0'));}return ys;},match);
 expect(result[0]).toBeGreaterThan(60);expect(result[1]).toBeLessThan(40);
});

test('le joueur focal n affiche plus de point jaune au-dessus de lui',async({page})=>{
 await page.goto('/index.html');
 const content=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');new Controller().show(match,{player:{age:14,club:'Blagnac U15',position:'BU'}});const focal=document.querySelector('[data-player-focal="true"]');return focal?getComputedStyle(focal,'::before').content:null;},match);
 expect(['none','normal']).toContain(content);
});

test('la couleur adverse varie entre les matchs et les gardiens gardent une couleur distincte',async({page})=>{
 await page.goto('/index.html');
 const result=await page.evaluate(async base=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');const controller=new Controller(),kits=[];let sample=null;for(let i=0;i<16;i+=1){controller.show({...base,matchId:`kit-${i}`,opponent:`Adversaire ${i}`},{player:{age:14,club:'Blagnac U15',position:'BU'}});const pitch=document.querySelector('[data-simulated-pitch]');kits.push(pitch?.dataset.opponentKit||'');if(!sample){const ownOut=document.querySelector('.sim-match-own:not([data-role="goalkeeper"])'),oppOut=document.querySelector('.sim-match-opponent:not([data-role="goalkeeper"])'),ownKeeper=document.querySelector('.sim-match-own[data-role="goalkeeper"]'),oppKeeper=document.querySelector('.sim-match-opponent[data-role="goalkeeper"]');sample={own:getComputedStyle(ownOut).backgroundColor,opponent:getComputedStyle(oppOut).backgroundColor,ownKeeper:getComputedStyle(ownKeeper).backgroundColor,opponentKeeper:getComputedStyle(oppKeeper).backgroundColor};}}return{kits,sample};},match);
 expect(new Set(result.kits).size).toBeGreaterThanOrEqual(4);expect(result.sample.own).not.toBe(result.sample.opponent);expect(result.sample.ownKeeper).not.toBe(result.sample.own);expect(result.sample.ownKeeper).not.toBe(result.sample.opponent);expect(result.sample.opponentKeeper).not.toBe(result.sample.opponent);expect(result.sample.opponentKeeper).not.toBe(result.sample.own);
});

test('une frappe affiche un ballon lisible et une trajectoire continue vers le but',async({page})=>{
 await page.goto('/index.html');
 const result=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');const controller=new Controller();controller.show(match,{player:{age:14,club:'Blagnac U15',position:'BU'},seed:'flight-browser'});const shot={id:'browser-shot',matchId:'visual-mobile',type:'SHOT',cameraState:'SHOT',clock:{period:'FIRST_HALF',regulationMinute:64,stoppageMinute:0},minuteLabel:"64'",possessionSide:'HOME',zone:{x:82,y:50,lane:'CENTER',third:'ATTACKING'},ballCarrier:{team:'HOME',index:9,role:'attacker'},playerContribution:'NONE',playerInvolved:true,score:{home:1,away:1},text:'Une fenêtre de frappe s ouvre.'};controller.timeline={...controller.timeline,events:[shot]};controller.index=0;controller.renderCurrent();const ball=document.querySelector('.sim-match-ball'),rect=ball?.getBoundingClientRect();return{flight:ball?.dataset.ballFlight,targetX:Number(ball?.dataset.ballTargetX),left:parseFloat(ball?.style.left||'0'),paths:document.querySelectorAll('[data-ball-path="true"]').length,width:rect?.width||0};},match);
 expect(result.flight).toBe('true');expect(result.targetX).toBeGreaterThan(result.left);expect(result.targetX).toBeGreaterThanOrEqual(97);expect(result.paths).toBe(1);expect(result.width).toBeGreaterThanOrEqual(9);
});

test('les nouvelles phases tactiques restent lisibles dans le rendu mobile',async({page})=>{
 await page.goto('/index.html');
 const result=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');const controller=new Controller();controller.show(match,{player:{age:25,club:'Blagnac U15',position:'MC'},seed:'tactical-browser'});const base={matchId:'visual-mobile',clock:{period:'FIRST_HALF',regulationMinute:30,stoppageMinute:0},minuteLabel:"30'",cameraState:'BUILD_UP',possessionSide:'HOME',zone:{x:54,y:46,lane:'CENTER',third:'MIDDLE'},ballCarrier:{team:'HOME',index:6,role:'midfielder'},playerContribution:'NONE',playerInvolved:false,score:{home:0,away:0},text:'Tactique.'};const events=[{...base,id:'pass',type:'PASSING_PATTERN',passingPattern:'THIRD_PLAYER'},{...base,id:'counter',type:'COUNTER_PRESS',cameraState:'DUEL',zone:{x:58,y:54,lane:'CENTER'}},{...base,id:'recovery',type:'DEFENSIVE_RECOVERY',cameraState:'COUNTER_ATTACK',zone:{x:68,y:36,lane:'LEFT'}},{...base,id:'offside',type:'OFFSIDE_TRAP',cameraState:'DANGER',zone:{x:61,y:48,lane:'CENTER'},ballPressure:true}];const frames=[];controller.timeline={...controller.timeline,playerAge:25,competition:'Ligue 1',events};for(let i=0;i<events.length;i+=1){controller.index=i;controller.renderCurrent();const pitch=document.querySelector('[data-simulated-pitch]');frames.push({type:events[i].type,passing:pitch?.dataset.passingPattern||'',counter:pitch?.dataset.counterPress,recovery:pitch?.dataset.recovery,offside:pitch?.dataset.offsideTrap,plan:document.querySelectorAll('.sim-passing-plan').length,actors:document.querySelectorAll('.sim-match-actor').length,balls:document.querySelectorAll('.sim-match-ball').length});}return frames;},match);
 expect(result[0].passing).toBe('THIRD_PLAYER');expect(result[0].plan).toBe(1);expect(result[1].counter).toBe('true');expect(result[2].recovery).toBe('true');expect(result[3].offside).toBe('true');for(const frame of result){expect(frame.actors).toBe(22);expect(frame.balls).toBe(1);}
});

test('le texte progressif peut être révélé immédiatement',async({page})=>{
 await page.goto('/index.html');
 const state=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');new Controller().show(match,{player:{age:14},seed:'text'});const text=document.querySelector('[data-sim-text]'),before=text.dataset.textComplete;document.querySelector('[data-sim-copy]').click();return{before,after:text.dataset.textComplete,content:text.textContent};},match);
 expect(state.before).toBe('false');expect(state.after).toBe('true');expect(state.content.length).toBeGreaterThan(20);
});

test('prefers-reduced-motion affiche le texte immédiatement',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/index.html');
 const complete=await page.evaluate(async match=>{const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');new Controller().show(match,{player:{age:14},seed:'reduced'});return document.querySelector('[data-sim-text]').dataset.textComplete;},match);
 expect(complete).toBe('true');
});
