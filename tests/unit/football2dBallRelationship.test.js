import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FEEL_TUNING } from "../../prototype/football-2d-v0/football2dModel.js";
import { createScenarioState, stepScenario } from "../../prototype/football-2d-v0/scenarioModel.js";

function assertBallInFront(state){const fx=state.player.facingX,fy=state.player.facingY,sx=-fy,sy=fx,rx=state.ball.x-state.player.x,ry=state.ball.y-state.player.y,forward=rx*fx+ry*fy,lateral=rx*sx+ry*sy;assert.ok(forward>=13,`ball went behind player: ${forward}`);assert.ok(Math.abs(lateral)<=12,`ball escaped sideways: ${lateral}`);}

test("controlled ball stays in front through a hard turn",()=>{let state=createScenarioState();for(let i=0;i<18;i+=1)state=stepScenario(state,{moveX:1,moveY:0},1/60,DEFAULT_FEEL_TUNING,{speed:80,acceleration:80});for(let i=0;i<30;i+=1){state=stepScenario(state,{moveX:0,moveY:-1},1/60,DEFAULT_FEEL_TUNING,{speed:80,acceleration:80});if(state.possession)assertBallInFront(state)}});

test("protection keeps the ball in the front foot envelope",()=>{let state=createScenarioState();for(let i=0;i<24;i+=1){state=stepScenario(state,{moveX:1,moveY:0,protecting:true},1/60,DEFAULT_FEEL_TUNING,{speed:80,acceleration:80});assert.equal(state.possession,true);assertBallInFront(state)}});
