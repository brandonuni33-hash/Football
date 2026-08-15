export function validateBlockMatchStories(results=[]){const interactive=(results||[]).filter(r=>r?.interactive&&r?.matchId);const ids=[...new Set(interactive.map(r=>r.matchId))];return{valid:ids.length<=1,interactiveMatchId:ids[0]||null,count:ids.length};}
export default validateBlockMatchStories;
