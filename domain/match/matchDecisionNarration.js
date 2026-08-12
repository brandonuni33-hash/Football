import { MATCH_COPY, stablePick, contextualFlow } from './matchNarrativeLibrary.js';

export function decisionNarration({minute,opponent,memory={},index=0,seed='match',scoreFor=0,scoreAgainst=0,confidence=50,fatigue=0}={}){
    const key=`decision:${index}:${minute}:${opponent}`;
    if(index===0){
        const opening=stablePick(seed,`${key}:opening`,MATCH_COPY.opening);
        return `${opening} Face à ${opponent}, tu as quelques secondes pour comprendre comment ton vis-à-vis réagit.`;
    }
    if(Number(memory.defenderStress)>=.35){
        return stablePick(seed,`${key}:stress`,[
            `À la ${minute}e, ton adversaire protège d’abord son dos. Tes précédentes accélérations ont laissé une trace.`,
            `À la ${minute}e, il ne sort plus de la même manière sur toi. Il garde maintenant un mètre de sécurité.`,
            `À la ${minute}e, son premier mouvement est devenu plus prudent. Tu l’as déjà obligé à douter.`
        ]);
    }
    if(Number(memory.pressureMisses)>0){
        return stablePick(seed,`${key}:miss`,[
            `À la ${minute}e, une nouvelle fenêtre s’ouvre. La précédente s’était refermée pendant ton hésitation.`,
            `À la ${minute}e, le match te rend une situation proche de celle que tu avais laissée passer.`,
            `À la ${minute}e, tu reconnais presque le même espace. Cette fois, il faudra décider plus vite.`
        ]);
    }
    if(Number(memory.technicalFailures)>=2){
        return stablePick(seed,`${key}:failures`,[
            `À la ${minute}e, l’adversaire attend désormais ton geste. Répéter la même chose ne suffira plus.`,
            `À la ${minute}e, ton vis-à-vis semble avoir lu tes deux dernières tentatives. Il faut changer le rythme ou l’angle.`,
            `À la ${minute}e, le prochain duel ressemble moins à une question de technique qu’à une question de lecture.`
        ]);
    }
    return `${contextualFlow({seed,key,scoreFor,scoreAgainst,confidence,fatigue})} À la ${minute}e, une vraie décision s’ouvre devant toi.`;
}
export default decisionNarration;
