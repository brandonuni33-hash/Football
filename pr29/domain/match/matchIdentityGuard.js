export function assertSameMatch(matchId,...items){if(!matchId)throw new Error('matchId canonique requis.');for(const item of items.flat()){if(item?.matchId&&item.matchId!==matchId)throw new Error(`Incohérence de matchId: ${item.matchId} au lieu de ${matchId}`);}return true;}
export function bindMatchId(matchId,item={}){if(!matchId)return null;if(item.matchId&&item.matchId!==matchId)throw new Error('Impossible de rattacher un fait provenant d’un autre match.');return{...item,matchId};}
export default assertSameMatch;
