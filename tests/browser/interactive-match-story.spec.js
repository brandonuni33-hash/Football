import { test, expect } from '@playwright/test';

test('une finale crée un rythme variable, manuel et plusieurs décisions', async ({ page }) => {
  await page.goto('/index.html');
  const flow = await page.evaluate(async () => {
    const { startInteractiveMatch, advanceInteractiveMatch } = await import('/domain/match/interactiveMatchController.js');
    const originalRandom=Math.random; Math.random=()=>.31;
    try {
      const state={player:{id:'p',club:'Street FC',position:'BU',overall:74,origin:'FUTSAL',mental:70,attributes:{tir:76,passe:69,controle:86,dribble:88},stats:{},hidden:{},temporaryEffects:[]},social:{coachData:{name:'Coach'}},career:{balance:0},consequences:[],careerMemory:[]};
      const session=startInteractiveMatch(state,{id:'final',phase:'Finale',type:'final',competitionName:'Coupe',opponent:'Rival',opponentStrength:66,home:true,playerSelection:{selected:true,started:true,minutes:90}},0);
      const decisionMoments=session.moments.length; let decisions=0,timed=0,technical=false,guard=0;
      while(!session.finished&&guard++<40){const step=session.step;if(step?.kind==='decision'){decisions++;if(step.timedDecision)timed++;technical ||= step.choices.some(c=>Boolean(c.gesture));advanceInteractiveMatch(state,session,{choiceIndex:0});}else advanceInteractiveMatch(state,session,{});}
      return{decisionMoments,decisions,timed,technical,finished:session.finished,resultDecisions:session.result?.decisions?.length};
    } finally { Math.random=originalRandom; }
  });
  expect(flow.decisionMoments).toBeGreaterThanOrEqual(4);
  expect(flow.decisionMoments).toBeLessThanOrEqual(6);
  expect(flow.decisions).toBe(flow.decisionMoments);
  expect(flow.resultDecisions).toBe(flow.decisionMoments);
  expect(flow.timed).toBeGreaterThanOrEqual(1);
  expect(flow.technical).toBe(true);
  expect(flow.finished).toBe(true);
});

test('un match ordinaire reste court et sans minuterie forcée', async ({ page }) => {
  await page.goto('/index.html');
  const result=await page.evaluate(async()=>{const{startInteractiveMatch}=await import('/domain/match/interactiveMatchController.js');const original=Math.random;Math.random=()=>.1;try{const state={player:{club:'FC',position:'MC',overall:60,origin:'CENTRE_FORMATION',attributes:{controle:55,dribble:52}}};const s=startInteractiveMatch(state,{opponent:'Club B',home:true,importance:'normal',playerSelection:{started:true,minutes:90}},0);return{count:s.moments.length};}finally{Math.random=original;}});
  expect(result.count).toBeGreaterThanOrEqual(1); expect(result.count).toBeLessThanOrEqual(2);
});

test('le match entre directement dans la première décision utile', async ({ page }) => {
  await page.goto('/index.html');
  const result=await page.evaluate(async()=>{const{startInteractiveMatch}=await import('/domain/match/interactiveMatchController.js');const state={player:{club:'FC',position:'BU',overall:60,attributes:{controle:60}}};const s=startInteractiveMatch(state,{opponent:'B',home:true,playerSelection:{started:true,minutes:90}},0);return{phase:s.step.phase,kind:s.step.kind,choices:s.step.choices.length};});
  expect(result.phase).toMatch(/^moment_/); expect(result.kind).toBe('decision'); expect(result.choices).toBeGreaterThan(0);
});

test('une décision chronométrée peut expirer sans choisir arbitrairement une option', async ({ page }) => {
  await page.goto('/index.html');
  const result=await page.evaluate(async()=>{const{startInteractiveMatch,advanceInteractiveMatch}=await import('/domain/match/interactiveMatchController.js');const original=Math.random;Math.random=()=>.31;try{const state={player:{club:'FC',position:'BU',overall:70,mental:50,attributes:{controle:80,tir:75}},career:{balance:0},consequences:[],careerMemory:[]};const s=startInteractiveMatch(state,{type:'final',phase:'Finale',opponent:'B',home:true,playerSelection:{started:true,minutes:90}},0);advanceInteractiveMatch(state,s,{});advanceInteractiveMatch(state,s,{});while(!s.step.timedDecision){advanceInteractiveMatch(state,s,{choiceIndex:s.step.kind==='decision'?0:null});}const before=s.decisions.length;advanceInteractiveMatch(state,s,{timedOut:true});return{before,after:s.decisions.length,last:s.decisions.at(-1)};}finally{Math.random=original;}});
  expect(result.after).toBe(result.before+1); expect(result.last.timedOut).toBe(true); expect(result.last.choice).toContain('temps écoulé');
});

test('la présentation du match échappe les textes narratifs', async ({ page }) => {
  await page.goto('/index.html');
  const rendered=await page.evaluate(async()=>{const{default:InteractiveMatchFlowController}=await import('/ui/interactiveMatchFlowController.js');const controller=new InteractiveMatchFlowController({ui:{gateway:{}}});controller.show({interactive:true,interactiveStep:{phase:'pre_match',kind:'narration',label:'AVANT-MATCH',progress:5,title:'<img src=x onerror=window.__matchInjected=true>',text:'<script>window.__matchInjected=true</script>',team:'<Street>',opponent:'Rival & City',home:true,score:{home:0,away:0},choices:[],items:[],actionLabel:'Continuer'}});return{injected:Boolean(window.__matchInjected),text:document.querySelector('[data-interactive-match-flow]')?.textContent||'',rogueImage:Boolean(document.querySelector('[data-interactive-match-flow] img')),rogueScript:Boolean(document.querySelector('[data-interactive-match-flow] script'))};});
  expect(rendered.injected).toBe(false);expect(rendered.text).toContain('<img src=x');expect(rendered.text).toContain('<script>');expect(rendered.rogueImage).toBe(false);expect(rendered.rogueScript).toBe(false);
});

test('les réactions médias restent invisibles tant que la carrière pro n est pas explicitement débloquée', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async () => {
    const { default: InteractiveMatchFlowController } = await import('/ui/interactiveMatchFlowController.js');
    const state = { player: { age: 22, stats: { matchesPlayed: 50 } }, media: { proCoverageUnlocked: false } };
    const ui = { gateway: { state } };
    const controller = new InteractiveMatchFlowController({ ui });
    const step = { phase:'reactions',kind:'reactions',label:'APRÈS-MATCH',title:'Réactions',text:'Le match est terminé.',team:'FC',opponent:'Rival',home:true,score:{home:1,away:0},choices:[],items:[{label:'Médias',text:'Les caméras te cherchent.'},{label:'Coach',text:'Le coach te félicite.'}],actionLabel:'Continuer' };
    controller.show({ interactiveStep: step });
    const before = document.querySelector('[data-interactive-match-flow]')?.textContent || '';
    state.media.proCoverageUnlocked = true;
    controller.show({ interactiveStep: step });
    const after = document.querySelector('[data-interactive-match-flow]')?.textContent || '';
    return { before, after };
  });
  expect(result.before).not.toContain('Les caméras te cherchent.');
  expect(result.before).toContain('Le coach te félicite.');
  expect(result.after).toContain('Les caméras te cherchent.');
});
