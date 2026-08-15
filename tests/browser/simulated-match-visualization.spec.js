import { test, expect } from '@playwright/test';

const match={matchId:'visual-mobile',matchIndex:0,home:true,team:'Blagnac U15',opponent:'Lens U15',competitionName:'U15',score:{home:2,away:1},goals:1,assists:0,shots:3,shotsOnTarget:2,duels:4,tackles:1,successfulPasses:18,playerPlayed:true};

for(const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932}]){
 test(`terrain simulé cadré en ${viewport.width}x${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('/index.html');
  const result=await page.evaluate(async match=>{
   const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');
   new Controller().show(match,{player:{age:14,club:'Blagnac U15'},seed:'mobile'});
   const pitch=document.querySelector('[data-simulated-pitch]'),rect=pitch.getBoundingClientRect();
   return{left:rect.left,right:rect.right,width:rect.width,height:rect.height,actors:document.querySelectorAll('.sim-match-actor').length,own:document.querySelectorAll('.sim-match-own').length,opponents:document.querySelectorAll('.sim-match-opponent').length,balls:document.querySelectorAll('.sim-match-ball').length,choices:document.querySelectorAll('[data-interactive-choice]').length};
  },match);
  expect(result.left).toBeGreaterThanOrEqual(-1);expect(result.right).toBeLessThanOrEqual(viewport.width+1);expect(result.width).toBeGreaterThan(280);expect(result.height).toBeGreaterThan(180);
  expect(result.actors).toBe(22);expect(result.own).toBe(11);expect(result.opponents).toBe(11);expect(result.balls).toBe(1);expect(result.choices).toBe(0);
 });
}

test('l identité visuelle de l équipe du joueur ne change jamais pendant le match',async({page})=>{
 await page.goto('/index.html');
 const result=await page.evaluate(async match=>{
  const {default:Controller}=await import('/ui/simulatedMatchVisualizationController.js');
  const controller=new Controller();controller.show(match,{player:{age:14,club:'Blagnac U15'},seed:'identity'});
  const frames=[];
  for(let index=0;index<controller.timeline.events.length;index+=1){
   controller.index=index;controller.renderCurrent();
   const focal=document.querySelector('[data-player-focal="true"]');
   frames.push({
    own:document.querySelectorAll('.sim-match-own').length,
    opponents:document.querySelectorAll('.sim-match-opponent').length,
    focalOwn:focal?focal.classList.contains('sim-match-own'):true,
    owner:document.querySelector('.sim-match-ball')?.dataset.ballOwner||''
   });
  }
  return frames;
 },match);
 expect(result.length).toBeGreaterThan(3);
 for(const frame of result){expect(frame.own).toBe(11);expect(frame.opponents).toBe(11);expect(frame.focalOwn).toBe(true);expect(frame.owner).not.toBe('none');}
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
