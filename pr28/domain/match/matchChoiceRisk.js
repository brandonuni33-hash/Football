export function choiceRisk({base=.2,technique=50,mental=50,fatigue=0,pressure=0,originBonus=0}={}){return Math.max(.03,Math.min(.75,Number(base)+Number(pressure)*.18+Number(fatigue)/300-(Number(technique)-50)/220-(Number(mental)-50)/400-Number(originBonus)));}
export default choiceRisk;
