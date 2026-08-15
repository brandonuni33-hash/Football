function gestureFamily(gesture='',choice=''){
 const text=`${gesture} ${choice}`.toLowerCase();
 if(/panenka/.test(text))return'panenka';
 if(/centre|premier poteau|second poteau/.test(text))return'cross';
 if(/frappe|tir|volée|piqu|lob|retourn|ciseau|finition/.test(text))return'shot';
 if(/contrôle|controle|amorti/.test(text))return'control';
 if(/passe|remise|décal|transversale/.test(text))return'pass';
 if(/petit pont|crochet|dribbl|double contact|changement d.appui|retour intérieur|extérieur du pied/.test(text))return'dribble';
 if(/tacle|interception|contre|duel/.test(text))return'defense';
 return'other';
}

function gestureLabel(gesture,choice){return String(gesture||choice||'Ton geste').trim();}

export function decisionOutcomeText({gesture=null,choice=null,success=true,duel=false,timedOut=false,minute=null,score=null,home=true,position=null,confidence=null}={}){
 const m=Number.isFinite(Number(minute))?`${Number(minute)}e minute. `:'';
 if(timedOut)return`${m}Tu vois l’espace, puis tu attends une fraction de seconde. Quand tu déclenches enfin, le défenseur a déjà fermé la porte. Tu repars en sachant exactement ce qui t’a échappé.`;
 const family=gestureFamily(gesture,choice),label=gestureLabel(gesture,choice);
 if(success&&family==='panenka')return`${m}${label}. Le gardien est déjà parti quand le ballon quitte ton pied. Pendant une seconde, tout ralentit avant que la trajectoire ne livre son verdict.`;
 if(success&&family==='shot')return`${m}${label}. Ton premier geste ouvre l’angle et tu peux armer avant le retour du défenseur. La frappe part : l’action dépend maintenant de sa précision.`;
 if(success&&family==='cross')return`${m}${label}. Le ballon quitte ton pied avant que le latéral puisse fermer. Dans la surface, tes partenaires attaquent enfin la zone que tu avais choisie.`;
 if(success&&family==='control')return`${m}${label}. Ton contrôle efface la première pression et place immédiatement le ballon sur ton prochain appui. Le défenseur doit freiner puis repartir.`;
 if(success&&family==='pass')return`${m}${label}. Tu fixes le premier rideau jusqu’au dernier instant, puis la passe trouve un partenaire face au jeu. La défense doit coulisser en urgence.`;
 if(success&&family==='dribble')return`${m}${label}. Ton changement de direction prend ton vis-à-vis à contre-pied. Il ne peut plus intervenir sans se retourner et te poursuivre.`;
 if(success&&family==='defense')return`${m}${label}. Tu interviens au moment où l’adversaire pousse son ballon. La récupération est propre et ton équipe peut ressortir vers l’avant.`;
 if(gesture&&success)return`${m}${label} passe. Ton adversaire doit corriger ses appuis et une nouvelle zone s’ouvre devant toi.`;
 if(gesture&&!success){if(Number(confidence)<=35)return`${m}${label} ne passe pas. Le ballon t’échappe et tu baisses les yeux une seconde avant de repartir. Le prochain choix comptera aussi pour ta confiance.`;if(family==='shot')return`${m}${label}. Le défenseur réduit l’angle au dernier instant et ta frappe ne trouve pas la trajectoire cherchée. Il faut déjà réagir au ballon qui revient.`;if(family==='cross')return`${m}${label}. Le latéral lit l’ouverture de ton pied et coupe le centre avant la surface.`;if(family==='control')return`${m}${label}. La première touche reste trop près du défenseur, qui profite de ce temps pour fermer la sortie.`;if(family==='pass')return`${m}${label}. Leur milieu anticipe la trajectoire et coupe la ligne avant ton partenaire.`;return`${m}${label} ne passe pas. Le défenseur lit le mouvement, touche le ballon et te force à sprinter immédiatement dans l’autre sens.`;}
 if(duel&&success)return`${m}Tu entres dans le duel sans reculer. Le ballon reste à toi et, quand tu relèves la tête, ton adversaire est encore en train de se retourner.`;
 if(duel&&!success)return`${m}Tu cherches le contact, mais il absorbe le choc et ressort avec le ballon. Le duel suivant ne pourra pas être joué de la même manière.`;
 if(score){const own=Number(score[home?'home':'away']||0),opp=Number(score[home?'away':'home']||0);if(own>opp)return`${m}Tu choisis la solution sûre et le ballon reste dans ton équipe. Rien de spectaculaire, mais l’adversaire vient de perdre encore quelques secondes.`;if(own<opp)return`${m}Tu prends le risque. L’action ne décide pas encore du score, mais elle force ton équipe à jouer quelques mètres plus haut.`;}
 if(/gardien/i.test(String(position||'')))return`${m}Ton choix de relance donne quelques secondes d’air à ta défense. Le bloc peut enfin remonter.`;
 return`${m}Ton choix ne décide pas encore du match. En revanche, l’adversaire vient d’apprendre quelque chose sur ce que tu es prêt à tenter.`;
}
export default decisionOutcomeText;
