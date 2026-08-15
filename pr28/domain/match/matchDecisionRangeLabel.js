export function decisionRangeLabel([min,max]=[1,2]){return min===max?`${min} décision${min>1?'s':''}`:`${min} à ${max} décisions possibles`;}
export default decisionRangeLabel;
