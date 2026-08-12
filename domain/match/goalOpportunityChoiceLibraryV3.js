// Street to Pro — occasions de but jouables V3 (OCC-041 à OCC-060).
const choice=(text,style,impacts={},gesture=null)=>({text,style,impacts,gesture});
const occ=(id,title,description,choices,meta={})=>({id,title,description,choices,...meta});
const S=(text,gesture)=>choice(text,'safe',{ratingBonus:.15,goalChance:.20,technicalRisk:.08},gesture);
const T=(text,gesture)=>choice(text,'technical',{ratingBonus:.19,goalChance:.23,technicalRisk:.14},gesture);
const R=(text,gesture)=>choice(text,'spectacular',{ratingBonus:.24,goalChance:.20,technicalRisk:.23},gesture);
const C=(text,gesture)=>choice(text,'collective',{ratingBonus:.17,assistChance:.20,passAccuracy:.09},gesture);

export const GOAL_OPPORTUNITY_CHOICES_V3=Object.freeze([
occ('OCC-041','La déviation te sert','Un défenseur dévie maladroitement le centre. Le ballon retombe juste devant toi avant que la défense ait le temps de se réorganiser.',[
S('Frapper immédiatement sans contrôle','Frappe sur déviation'),T('Contrôler avant de replacer','Contrôle et finition'),R('Ajuster d’un contrôle orienté puis finir','Contrôle orienté et frappe')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-042','Le gardien hésite','Le gardien est entre deux décisions : trop avancé pour rester passif, trop loin pour vraiment sortir. Une demi-seconde s’ouvre.',[
S('Frapper fort au centre','Frappe sur gardien hésitant'),T('Chercher un angle précis','Finition placée'),R('Feinter la frappe pour le faire bouger','Feinte face au gardien')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-043','La barre remet le ballon en jeu','Le centre heurte la transversale et retombe dans la surface. Personne ne réagit tout de suite.',[
R('Reprendre immédiatement de volée','Volée après la barre'),S('Contrôler avant de conclure','Contrôle après rebond'),R('Plonger de la tête vers le ballon','Tête plongeante')],{groups:['attacker','winger','midfielder','defender'],weight:3}),
occ('OCC-044','Seul contre trois','Après une perte de balle collective, tu te retrouves isolé face à trois défenseurs qui ferment les angles.',[
R('Tenter quand même le geste individuel','Percée un contre trois'),C('Temporiser pour attendre un soutien','Temporisation sous pression'),choice('Chercher à provoquer la faute','cunning',{ratingBonus:.09,goalChance:.05,technicalRisk:.17},'Faute provoquée')],{groups:['attacker','winger','midfielder'],weight:2}),
occ('OCC-045','Le latéral centre après son raid','Ton latéral vient d’avaler tout son couloir et envoie un centre fort dans la surface.',[
S('Reprendre du premier temps','Frappe sur centre du latéral'),T('Contrôler avant de frapper','Contrôle puis frappe'),C('Dévier vers le second poteau','Déviation second poteau')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-046','Deux appels, une seule passe','Deux partenaires réclament le ballon dans des zones différentes. L’un est plus libre, l’autre plus proche du but.',[
C('Servir le joueur excentré mais démarqué','Passe vers joueur libre'),C('Servir le joueur central malgré le marquage','Passe verticale risquée'),R('Ignorer les deux et tenter ta chance','Frappe personnelle')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-047','La relance adverse se casse','La dernière passe de la défense est ratée. Tu récupères près de la surface avec quelques secondes avant le retour.',[
S('Frapper immédiatement sur la surprise','Frappe sur erreur de relance'),T('Contrôler pour assurer le geste','Contrôle après interception'),R('Contourner le dernier défenseur avant de finir','Dribble après interception')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-048','Le centre passe derrière toi','Le centre est trop long, mais tu as assez d’espace pour tenter un geste acrobatique avant qu’il ne sorte de la zone.',[
R('Tenter le retourné','Retourné acrobatique'),S('Contrôler de la poitrine avant de frapper','Poitrine puis frappe'),C('Remiser vers le partenaire en soutien','Remise après centre long')],{groups:['attacker','winger','midfielder'],weight:2}),
occ('OCC-049','La frappe te revient','Ta première tentative est contrée et revient immédiatement dans un angle encore meilleur.',[
S('Reprendre sans contrôle','Deuxième frappe immédiate'),T('Contrôler avant de replacer','Deuxième frappe placée'),R('Enchaîner par un geste technique rapide','Enchaînement après contre')],{groups:['attacker','winger','midfielder','defender'],weight:4}),
occ('OCC-050','La dernière action avant la pause','La première période touche à sa fin. L’arbitre regarde déjà sa montre et cette attaque sera probablement la dernière.',[
R('Frapper immédiatement','Frappe avant la pause'),T('Prendre un dernier contrôle propre','Contrôle sous chrono'),C('Temporiser pour un ultime centre','Dernier centre avant la pause')],{groups:['attacker','winger','midfielder'],weight:3,maxMinute:47}),
occ('OCC-051','Le dégagement tombe sur toi','Le dégagement adverse manque complètement sa cible et arrive directement dans tes pieds.',[
S('Frapper sans contrôle','Frappe sur dégagement raté'),T('Contrôler avant de frapper posément','Contrôle et frappe posée'),R('Ajouter un geste technique avant de conclure','Geste après dégagement raté')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-052','Le gardien vient d’encaisser','Le gardien adverse vient d’être battu et semble encore secoué lorsque la nouvelle occasion se présente.',[
S('Frapper vite et fort','Frappe après but encaissé'),T('Chercher la précision','Finition calme'),R('Tenter un geste osé','Finition provocante')],{groups:['attacker','winger','midfielder'],weight:2,requiresOpponentJustConceded:true}),
occ('OCC-053','Le vent coupe les trajectoires','Un vent fort traverse le terrain et rend les ballons aériens difficiles à lire.',[
S('Frapper au ras du sol','Frappe basse sous le vent'),R('Tenter malgré tout une frappe enroulée','Enroulé dans le vent'),C('Chercher une passe plutôt qu’un tir','Passe sous conditions difficiles')],{groups:['attacker','winger','midfielder'],weight:2,requiresStrongWind:true}),
occ('OCC-054','La pelouse accélère le ballon','Le terrain détrempé rend le contrôle incertain et le ballon fuse plus vite que prévu.',[
S('Frapper directement sans contrôler','Frappe sur terrain glissant'),T('Tenter le contrôle malgré la pelouse','Contrôle sur pelouse humide'),C('Jouer simple vers un partenaire','Passe de sécurité')],{groups:['attacker','winger','midfielder','defender'],weight:3,requiresWetPitch:true}),
occ('OCC-055','L’espace s’ouvre à onze contre dix','Depuis l’expulsion adverse, les distances s’allongent. Un énorme espace apparaît devant toi dans la surface.',[
S('Profiter immédiatement de l’espace pour frapper','Frappe en supériorité'),C('Faire encore circuler pour épuiser le bloc','Circulation à onze contre dix'),R('Tenter un geste individuel supplémentaire','Dribble en supériorité')],{groups:['attacker','winger','midfielder'],weight:2,requiresOpponentRedCard:true}),
occ('OCC-056','Il ne te lâche pas','Ton défenseur direct reste collé dans ton dos et coupe tous tes premiers appuis.',[
T('Pivoter rapidement pour te retourner','Pivot sous marquage'),C('Décrocher pour créer de l’espace ailleurs','Décrochage sous marquage'),choice('Chercher le contact et la faute','cunning',{ratingBonus:.09,goalChance:.05,technicalRisk:.17},'Faute cherchée dos au but')],{groups:['attacker','midfielder'],weight:4}),
occ('OCC-057','La passe saute toute la ligne','Une passe lobée élimine d’un coup la défense et retombe devant toi dans la surface.',[
T('Contrôler de la poitrine avant de frapper','Poitrine sur passe lobée'),R('Reprendre directement de volée','Volée sur passe lobée'),T('Amortir du pied puis accélérer','Amorti et accélération')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-058','Il réclame le ballon, mais tu vois le but','Un partenaire crie pour recevoir alors que ta propre position semble plus dangereuse.',[
S('Faire confiance à ta lecture et tirer','Frappe malgré l’appel'),C('Transmettre malgré ton avantage apparent','Passe sous pression du partenaire'),T('Feinter la passe puis conclure','Feinte de passe et frappe')],{groups:['attacker','winger','midfielder'],weight:3}),
occ('OCC-059','Ton rush t’a vidé','Après une longue course balle au pied, tes appuis deviennent moins propres au moment de conclure.',[
R('Forcer quand même la conclusion','Finition après long rush'),C('Chercher un dernier soutien','Passe après effort long'),T('Ralentir une fraction de seconde pour te stabiliser','Stabilisation avant frappe')],{groups:['attacker','winger','midfielder'],weight:3,requiresFatigue:true}),
occ('OCC-060','Tu te vois déjà marquer','Pendant une fraction de seconde, le but te paraît acquis avant même d’avoir frappé.',[
T('Te reconcentrer immédiatement sur le geste','Recentrage mental'),R('Continuer avec cette décontraction','Finition relâchée'),S('Ralentir consciemment pour assurer','Finition calme')],{groups:['attacker','winger','midfielder'],weight:2,requiresHighConfidence:true})
]);
export default GOAL_OPPORTUNITY_CHOICES_V3;