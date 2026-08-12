export function matchPacing({type='standard',importance='normal',started=true,scoreDiff=0}={}){if(!started)return'urgent';if(type==='rival')return'aggressive';if(type==='final')return'reversals';if(Math.abs(Number(scoreDiff)||0)>=2)return'locked';if(importance==='important'||importance==='exceptional')return'progressive';return'direct';}
export default matchPacing;
