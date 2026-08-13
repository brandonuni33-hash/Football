import{FIELD,createFootball2DState,stepFootball2D}from"./football2dModel.js";
import{createOpponentState,stepOpponentAI}from"./opponentAI.js";
import{stepGoalkeeper}from"./goalkeeperAI.js";

export function createScenarioState(){return{...createFootball2DState(),...createOpponentState(FIELD)};}

export function stepScenario(state,input={},dt=1/60){
  const slice=Math.min(dt,.02);
  const previousBall={...state.ball};
  let next=stepFootball2D(state,input,slice);
  if(next.status==="goal")return next;

  const defense=stepOpponentAI({defender:next.defender,keeper:next.keeper,player:next.player,ball:next.ball,possession:next.possession},FIELD,slice);
  next={...next,defender:defense.defender,keeper:defense.keeper,ball:defense.ball,possession:defense.possession,lastEvent:defense.event??next.lastEvent};

  const keeping=stepGoalkeeper(next.keeper,previousBall,next.ball,FIELD,slice);
  return{...next,keeper:keeping.keeper,ball:keeping.ball,possession:keeping.event?false:next.possession,lastEvent:keeping.event??next.lastEvent};
}
