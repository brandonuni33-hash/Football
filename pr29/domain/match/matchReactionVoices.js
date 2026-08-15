const fact=result=>{const event=result?.events?.find(e=>e.gesture||e.timedOut)||result?.events?.at(-1);if(event?.gesture)return event.gesture;if(event?.timedOut)return'l’hésitation dans le moment chaud';if(result?.goals>=3)return`les ${result.goals} buts`;if(result?.goals===2)return'le doublé';if(result?.goals===1)return'le but';if(result?.assists)return`${result.assists} passe${result.assists>1?'s':''} décisive${result.assists>1?'s':''}`;return'la prestation';};
const tier=result=>{const age=Number(result?.age||0),text=String(result?.level||result?.competition||'').toLowerCase();if((age&&age<=15)||/u15/.test(text))return'u15';if((age&&age<=18)||/u17|u18|formation|academy|jeune/.test(text))return'youth';if(/regional|régional|national|semi|amateur/.test(text))return'semi';return'pro';};
export function buildMatchReactionVoices(result={}){if(!result.matchId)return[];const f=fact(result),positive=result.result==='win'||result.rating>=7,t=tier(result),opponent=result.opponent||'l’adversaire';
 if(t==='u15')return[
  {id:`${result.matchId}:parent`,matchId:result.matchId,voice:'proche au bord du terrain',text:positive?`« Sur ${f}, tu n’as pas réfléchi. Tu l’as fait, c’est tout. »`:`« Oublie ${f}. Ce qui compte, c’est ce que tu fais au prochain entraînement. »`},
  {id:`${result.matchId}:teammate`,matchId:result.matchId,voice:'coéquipier',text:`« Sur ${f}, j’ai cru que ça allait passer avant même que tu touches le ballon. »`},
  {id:`${result.matchId}:coach-eye`,matchId:result.matchId,voice:'éducateur adverse',text:`« ${f}, oui. Mais surtout, il lit vite ce qui se passe autour de lui. »`}
 ];
 if(t==='youth')return[
  {id:`${result.matchId}:club`,matchId:result.matchId,voice:'compte du club',text:positive?`« Match plein d’intensité face à ${opponent}. ${f} fait partie des images qu’on retiendra. »`:`« Une soirée plus difficile face à ${opponent}. ${f} n’efface pas le travail à faire. »`},
  {id:`${result.matchId}:observer`,matchId:result.matchId,voice:'observateur',text:`« Au-delà de ${f}, ses prises d’information avant contrôle sont intéressantes. »`},
  {id:`${result.matchId}:teammate`,matchId:result.matchId,voice:'coéquipier',text:`« ${f}, tout le monde l’a vu. Moi, j’ai surtout vu ce que tu faisais juste avant. »`}
 ];
 const venue=t==='semi'?'au stade et autour du club':'sur les réseaux et dans les tribunes';
 return[
 {id:`${result.matchId}:fan-hot`,matchId:result.matchId,voice:'supporter enthousiaste',text:positive?`« ${f} ! C’est exactement pour vivre des matchs comme ça qu’on vient. »`:`« ${f}, ça fait mal… mais je préfère le voir tenter que disparaître. »`},
 {id:`${result.matchId}:fan-critical`,matchId:result.matchId,voice:'supporter critique',text:result.rating<6?`« On peut parler de ${f}, mais la vraie réponse devra venir au prochain match. »`:`« Très bien pour ${f}. Maintenant, il faut le refaire quand l’adversaire ferme tout. »`},
 {id:`${result.matchId}:tactical`,matchId:result.matchId,voice:'journaliste tactique',text:`« Au-delà de ${f}, ses choix ont obligé ${opponent} à défendre différemment. »`},
 {id:`${result.matchId}:former`,matchId:result.matchId,voice:'ancien joueur',text:`« ${f}, tout le monde le voit. Ce qui m’intéresse, c’est la décision prise une seconde avant. »`},
 {id:`${result.matchId}:provocative`,matchId:result.matchId,voice:'média provocateur',text:positive?`« ${f} suffit-il déjà à changer son statut ? Le débat est lancé ${venue}. »`:`« ${f} : accident de parcours ou premier vrai signal d’alerte ? »`}
 ];}
export default buildMatchReactionVoices;
