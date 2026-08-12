export function altercationAvailable({duels=0,defenderStress=0,cards=0,type='standard'}={}){const tension=Number(duels)*.12+Number(defenderStress)+Number(cards)*.18+(type==='rival'?.2:0);return{available:tension>=.55,tension:Math.min(1,tension)};}
export default altercationAvailable;
