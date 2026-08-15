const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function gestureSuccessChance({technique=50,origin='',difficulty=.5,pressure=.5,fatigue=0,contextFit=1}={}){const o=String(origin?.id||origin).toUpperCase(),identity=o==='FUTSAL'||o==='STREET'?.07:0;return clamp(.18+(Number(technique)||0)/130+identity-(Number(difficulty)||0)*.28-(Number(pressure)||0)*.14-(Number(fatigue)||0)/500+(Number(contextFit)||0)*.08,.05,.9);}
export function resolveGesture(input={},roll=Math.random()){const chance=gestureSuccessChance(input);return{success:Number(roll)<chance,chance};}
export default resolveGesture;
