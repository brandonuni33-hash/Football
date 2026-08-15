// Rapport du seul match réellement joué avec décisions.
export function buildInteractiveMatchReport(result={}){
 if(!result.matchId||!result.played)return null;
 const turningPoint=result.events?.find(e=>e.gesture||e.timedOut)||result.events?.at(-1)||null;
 const influence=result.goals?`Ton impact direct se lit dans ${result.goals} but${result.goals>1?'s':''}.`:result.assists?`Tu as directement créé ${result.assists} but${result.assists>1?'s':''} pour les autres.`:result.rating>=7.5?'Même sans statistique décisive, tu as pesé sur le rapport de force.':'Ton influence est restée limitée et le match te laisse davantage de questions que de certitudes.';
 const turning=turningPoint?.gesture?`${turningPoint.gesture} devient l’image forte de ton match.`:turningPoint?.timedOut?'Une hésitation dans un moment de pression reste le tournant personnel de ta rencontre.':turningPoint?.text||'Le match s’est joué sur des détails.';
 return{matchId:result.matchId,label:'Le récit du match',title:`${result.teamGoals} – ${result.opponentGoals} contre ${result.opponent}`,text:`${turning} ${influence}`,turningPoint:turningPoint||null,decisions:(result.decisions||[]).filter(d=>!d.matchId||d.matchId===result.matchId)};
}
export default buildInteractiveMatchReport;
