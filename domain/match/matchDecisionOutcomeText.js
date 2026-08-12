import { MATCH_COPY, stablePick } from './matchNarrativeLibrary.js';

export function decisionOutcomeText({gesture=null,success=true,duel=false,timedOut=false,seed='match',key='outcome'}={}){
    if(timedOut) return stablePick(seed,`${key}:timeout`,MATCH_COPY.timeout);
    if(gesture&&success) return `${gesture} passe. ${stablePick(seed,`${key}:gesture-success`,MATCH_COPY.success)}`;
    if(gesture&&!success) return `${gesture} ne passe pas. ${stablePick(seed,`${key}:gesture-fail`,MATCH_COPY.failure)}`;
    if(duel&&success) return stablePick(seed,`${key}:duel-success`,[
        'Tu imposes le duel et ressors avec le ballon. Ton adversaire sait maintenant qu’il devra mieux choisir son moment.',
        'Tu prends le dessus au contact. Sur l’action suivante, il garde déjà un peu plus de distance.',
        'Le duel tourne pour toi. Le ballon reste vivant et l’action peut continuer.'
    ]);
    if(duel&&!success) return stablePick(seed,`${key}:duel-fail`,[
        'Tu vas au contact, mais ton adversaire tient sa position et récupère.',
        'Le duel est franc. Cette fois, il prend le dessus et te force à revenir défendre.',
        'Tu cherches l’impact, mais il utilise ton élan pour protéger le ballon.'
    ]);
    return stablePick(seed,`${key}:${success?'success':'failure'}`,success?MATCH_COPY.success:MATCH_COPY.failure);
}
export default decisionOutcomeText;
