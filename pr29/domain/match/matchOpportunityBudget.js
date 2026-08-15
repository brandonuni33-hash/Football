export function opportunityBudget({planned=2,scoreDiff=0,locked=false,dominance=0}={}){let count=Math.max(1,Math.floor(Number(planned)||1));if(locked)count=Math.max(1,count-1);if(Math.abs(Number(scoreDiff)||0)>=3)count=Math.max(1,count-1);if(Math.abs(Number(dominance)||0)>=.75)count=Math.max(1,count-1);return count;}
export default opportunityBudget;
