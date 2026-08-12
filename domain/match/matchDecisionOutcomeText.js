export function decisionOutcomeText({gesture=null,success=true,duel=false,timedOut=false,minute=null,score=null,home=true,position=null,confidence=null}={}){
 const m=Number.isFinite(Number(minute))?`${Number(minute)}e minute. `:'';
 if(timedOut)return`${m}Tu vois l’espace, puis tu attends une fraction de seconde. Quand tu déclenches enfin, le défenseur a déjà fermé la porte. Tu repars en sachant exactement ce qui t’a échappé.`;
 if(gesture&&success){if(/panenka/i.test(String(gesture)))return`${m}${gesture}. Le gardien est déjà parti quand le ballon quitte ton pied. Pendant une seconde, tout ralentit avant que le filet ne bouge.`;return`${m}${gesture} passe. Ton adversaire doit tourner les hanches pour revenir et tu gagnes enfin le demi-mètre que tu cherchais.`;}
 if(gesture&&!success){if(Number(confidence)<=35)return`${m}${gesture} ne passe pas. Le ballon t’échappe et tu baisses les yeux une seconde avant de repartir. Le prochain choix comptera aussi pour ta confiance.`;return`${m}${gesture} ne passe pas. Le défenseur lit le mouvement, touche le ballon et te force à sprinter immédiatement dans l’autre sens.`;}
 if(duel&&success)return`${m}Tu entres dans le duel sans reculer. Le ballon reste à toi et, quand tu relèves la tête, ton adversaire est encore en train de se retourner.`;
 if(duel&&!success)return`${m}Tu cherches le contact, mais il absorbe le choc et ressort avec le ballon. Le duel suivant ne pourra pas être joué de la même manière.`;
 if(score){const own=Number(score[home?'home':'away']||0),opp=Number(score[home?'away':'home']||0);if(own>opp)return`${m}Tu choisis la solution sûre et le ballon reste dans ton équipe. Rien de spectaculaire, mais l’adversaire vient de perdre encore quelques secondes.`;if(own<opp)return`${m}Tu prends le risque. L’action ne décide pas encore du score, mais elle force ton équipe à jouer quelques mètres plus haut.`;}
 if(/gardien/i.test(String(position||'')))return`${m}Ton choix de relance donne quelques secondes d’air à ta défense. Le bloc peut enfin remonter.`;
 return`${m}Ton choix ne décide pas encore du match. En revanche, l’adversaire vient d’apprendre quelque chose sur ce que tu es prêt à tenter.`;
}
export default decisionOutcomeText;
