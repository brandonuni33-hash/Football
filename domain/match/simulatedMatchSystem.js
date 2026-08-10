// domain/match/simulatedMatchSystem.js
// Simulation canonique : aucun calcul legacy de note n'est exécuté en parallèle.
import { evaluateMatch } from './matchPerformanceEngine.js';
import { PotentialSystem } from '../../potentialSystem.js';
import { PlayerLogic } from '../../player.js';
import { CompetitionSystem } from '../../competitionSystem.js';
import { EconomyManager } from '../../economy.js';

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));
function roleOf(position){const p=String(position||'').toUpperCase();if(['GK','GB','G'].includes(p))return'goalkeeper';if(['DC','CB','DD','DG','RB','LB','D','LAT'].includes(p))return'defender';if(['MC','CM','MOC','CAM','MD','MG','M','MDEF','MOFF'].includes(p))return'midfielder';return'attacker';}
function opponentGoals(strength,home){const base=.55+clamp(strength,25,95)/115+(home?-.08:.05);return Math.min(5,Math.max(0,Math.floor(Math.random()*(base+1))));}
function teamGoals(performance){const quality=clamp((performance.performanceLevel||0)+.55,-.2,1.1);const base=.55+quality*.85+(performance.goals||0)*.35;return Math.min(5,Math.max(0,Math.floor(Math.random()*(base+1))));}

export class SimulatedMatchSystem{
 simulateBlock(state){
  const player=state?.player;if(!player)throw new Error('SimulatedMatchSystem: joueur absent.');
  const plan=CompetitionSystem.getBlockPlan(state);const scheduled=Array.isArray(plan?.scheduledMatches)?plan.scheduledMatches:[];const role=roleOf(player.position);const results=[];
  for(const [matchIndex,match] of scheduled.entries()){
   const strength=n(match?.opponentStrength??match?.opponentOverall??55)||55;
   const important=match?.importance==='important'||match?.importance==='exceptional'||String(match?.phase||'').toLowerCase().includes('final')||String(match?.round||'').toLowerCase().includes('final');
   const perf=evaluateMatch(player,{opponentStrength:strength,opponentOverall:strength,important,minutes:90});
   const home=typeof match?.home==='boolean'?match.home:true;const gf=teamGoals(perf);const ga=opponentGoals(strength,home);
   const row={matchIndex,competitionId:match?.competitionId||null,competitionType:match?.competitionType||match?.type||null,competitionName:match?.competitionName||match?.competition||match?.competitionId||'Match',phase:match?.phase||null,round:match?.round||match?.europeanRound||null,opponent:match?.opponent||match?.awayClub||match?.homeClub||'Adversaire',opponentStrength:strength,home,venue:match?.venue||null,score:{home:home?gf:ga,away:home?ga:gf},teamGoals:gf,opponentGoals:ga,result:gf>ga?'win':gf<ga?'loss':'draw',rating:perf.rating,goals:perf.goals,assists:perf.assists,tackles:perf.tackles,interceptions:perf.interceptions,successfulPasses:perf.successfulPasses,passes:perf.passes,cleanSheet:Boolean(role==='goalkeeper'&&ga===0),shots:perf.shots,shotsOnTarget:perf.shotsOnTarget,duels:perf.duels,duelsWon:perf.duelsWon,expression:perf.expression,performanceLevel:perf.performanceLevel,played:true};
   results.push(row);
   const s=player.stats||(player.stats={});const previous=n(s.matchesPlayed);s.matchesPlayed=previous+1;s.goals=n(s.goals)+row.goals;s.assists=n(s.assists)+row.assists;s.tackles=n(s.tackles)+row.tackles;s.successfulPasses=n(s.successfulPasses)+row.successfulPasses;if(row.cleanSheet)s.cleanSheets=n(s.cleanSheets)+1;s.averageRating=Number((((n(s.averageRating)*previous)+row.rating)/(previous+1)).toFixed(1));
   PotentialSystem.recordMatch(player,{rating:row.rating,goals:row.goals,assists:row.assists,tackles:row.tackles},1);
   PlayerLogic.applyProgression(player,{rating:row.rating,goals:row.goals,assists:row.assists,type:'match'});
  }
  const matches=results.length;const rating=matches?Number((results.reduce((s,r)=>s+r.rating,0)/matches).toFixed(1)):0;const summary={rating,goals:results.reduce((s,r)=>s+n(r.goals),0),assists:results.reduce((s,r)=>s+n(r.assists),0),passes:results.reduce((s,r)=>s+n(r.successfulPasses),0),tackles:results.reduce((s,r)=>s+n(r.tackles),0),cleanSheets:results.reduce((s,r)=>s+(r.cleanSheet?1:0),0),yellowCards:0,matchesPlayed:matches,injured:false};
  if(matches){player.morale=clamp(n(player.morale??50)+(rating>=7?3:rating<5.8?-2:0),0,100);player.fitness=clamp(n(player.fitness??80)-matches*2,0,100);}else player.fitness=clamp(n(player.fitness??80)+20,0,100);
  const finance=EconomyManager.processBlockFinances(state,summary);const european=CompetitionSystem.recordEuropeanResults?.(state,scheduled,results)||null;
  return{results,summary:{...summary,blockPlan:plan,scheduledMatches:scheduled,matchResults:results,finance,european}};
 }
}
export default SimulatedMatchSystem;
