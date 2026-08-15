export function decisionWeight({type='standard',importance='normal',minute=45,scoreDiff=0}={}){let weight=.35;if(type==='final')weight+=.3;if(type==='rival')weight+=.2;if(importance==='important'||importance==='exceptional')weight+=.12;if(Number(minute)>=75)weight+=.14;if(Math.abs(Number(scoreDiff)||0)<=1)weight+=.09;return Math.max(.2,Math.min(1,weight));}
export default decisionWeight;
