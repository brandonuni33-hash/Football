export const DEFAULT_ATHLETIC_PROFILE=Object.freeze({speed:80,acceleration:80});
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function normalizeAthleticProfile(input={}){return{speed:clamp(Number(input.speed)||80,1,99),acceleration:clamp(Number(input.acceleration)||80,1,99)}}
export function getAthleticMotion(input=DEFAULT_ATHLETIC_PROFILE){const p=normalizeAthleticProfile(input);return{profile:p,maxSpeedScale:p.speed/100,accelerationPerSecond:2.1+p.acceleration/100*2.4,decelerationPerSecond:5.8,burstMaxScale:1.06,burstAccelerationScale:1.35,burstDuration:.34}}
