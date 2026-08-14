import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FEEL_TUNING, getBallControlFeel, getDribblePace, getInteractionDribble } from "../../prototype/football-2d-v0/football2dModel.js";
import { getAthleticMotion } from "../../prototype/football-2d-v0/playerAthleticProfile.js";
import { createScenarioState, stepScenario } from "../../prototype/football-2d-v0/scenarioModel.js";

function advance(profile,input,frames=12){let state=createScenarioState();for(let i=0;i<frames;i+=1)state=stepScenario(state,input,1/60,DEFAULT_FEEL_TUNING,profile);return state;}

test("speed stat changes maximum movement",()=>{const slow=advance({speed:60,acceleration:99},{moveX:1},18),fast=advance({speed:90,acceleration:99},{moveX:1},18);assert.ok(fast.player.x>slow.player.x);});

test("acceleration stat changes the first metres",()=>{const low=advance({speed:80,acceleration:50},{moveX:1},6),high=advance({speed:80,acceleration:99},{moveX:1},6);assert.ok(high.player.x>low.player.x);});

test("protection caps movement and keeps the ball close",()=>{const state=advance({speed:99,acceleration:99},{moveX:1,protecting:true},24);assert.ok(state.driveMagnitude<=.49);assert.equal(state.dribbleMode,"protection");});

test("double-push makes the player chase even after joystick release",()=>{let state=advance({speed:80,acceleration:80},{moveX:1},12),startX=state.player.x;state=stepScenario(state,{moveX:1,burstTriggered:true,burstX:1,burstY:0},1/60,DEFAULT_FEEL_TUNING,{speed:80,acceleration:80});assert.ok(state.burstTime>0);assert.equal(state.dribbleMode,"poussee");for(let i=0;i<12;i+=1)state=stepScenario(state,{moveX:0,moveY:0},1/60,DEFAULT_FEEL_TUNING,{speed:80,acceleration:80});assert.ok(state.player.x>startX+20);assert.ok(state.ball.x>state.player.x);});

test("burst ends by recovery instead of pulling the ball backwards",()=>{let state=advance({speed:80,acceleration:80},{moveX:1},12);state=stepScenario(state,{moveX:1,burstTriggered:true,burstX:1,burstY:0},1/60,DEFAULT_FEEL_TUNING,{speed:80,acceleration:80});let previousBallX=state.ball.x;for(let i=0;i<80&&state.burstTime>0;i+=1){state=stepScenario(state,{moveX:0,moveY:0},1/60,DEFAULT_FEEL_TUNING,{speed:80,acceleration:80});assert.ok(state.ball.x>=previousBallX-.01);previousBallX=state.ball.x}assert.equal(state.burstTime,0);assert.equal(state.possession,true);});

test("burst touch is longer than ordinary fast dribble",()=>{const control=getBallControlFeel(),fast=getDribblePace(1,control),burst=getInteractionDribble(fast,control,{burstActive:true,burstX:1});assert.ok(burst.touchDistance>fast.touchDistance);});

test("speed 80 maps to 80 percent of prototype top speed",()=>{assert.equal(getAthleticMotion({speed:80,acceleration:80}).maxSpeedScale,.8);});
