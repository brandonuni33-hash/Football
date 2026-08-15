// Street to Pro — occasions de but jouables V5 (OCC-081 à OCC-100).
const choice=(text,style,impacts={},gesture=null)=>({text,style,impacts,gesture});
const occ=(id,title,description,choices,meta={})=>({id,title,description,choices,...meta});
const S=(t,g)=>choice(t,'safe',{ratingBonus:.15,goalChance:.20,technicalRisk:.08},g);
const T=(t,g)=>choice(t,'technical',{ratingBonus:.19,goalChance:.23,technicalRisk:.14},g);
const R=(t,g)=>choice(t,'spectacular',{ratingBonus:.24,goalChance:.20,technicalRisk:.23},g);
const C=(t,g)=>choice(t,'collective',{ratingBonus:.17,assistChance:.20,passAccuracy:.09},g);
export const GOAL_OPPORTUNITY_CHOICES_V5=Object.freeze([
occ('OCC-081','Tu annonces la couleur dès le début','À peine le match lancé, tu élimines déjà ton premier défenseur d’un geste spectaculaire.',[
R('Continuer sur cette dynamique et tenter ta chance','Frappe après festival précoce'),S('Calmer le jeu et construire proprement','Recentrage après dribble'),C('Chercher un partenaire pour prolonger l’action','Passe après dribble précoce')],{groups:['attacker','winger','midfielder'],weight:2,maxMinute:6}),
occ('OCC-082','Ton appel est parfaitement synchronisé','La passe et ta course se croisent au bon moment. Tu pars dans le dos de la défense sans être repris.',[
S('Contrôler avant de conclure','Contrôle en profondeur'),R('Reprendre au premier temps','Frappe première intention'),T('Prolonger la course pour ouvrir l’angle','Conduite face au but')],{groups:['attacker','winger','midfielder'],weight:5}),
occ('OCC-083','Le ballon traîne dans la surface','Un cafouillage enferme plusieurs joueurs autour du ballon sans que personne ne réussisse à le dégager.',[
R('Te jeter pour pousser le ballon','Finition au sol'),S('Rester debout pour frapper proprement','Frappe dans le cafouillage'),C('Dégager vers un partenaire mieux placé','Remise dans le cafouillage')],{groups:['attacker','winger','midfielder','defender'],weight:3}),
occ('OCC-084','Tu amortis de la poitrine','Le ballon arrive haut et fort. Tu peux l’amortir ou tenter de le détourner avant le retour du défenseur.',[
T('Amortir puis frapper immédiatement','Poitrine puis frappe rapide'),S('Contrôler puis prendre le temps de viser','Poitrine puis finition placée'),R('Dévier directement de la poitrine vers le but','Déviation poitrine')],{groups:['attacker','midfielder'],weight:2}),
occ('OCC-085','Un adversaire reste au sol','Un joueur adverse s’écroule juste avant ton occasion. L’arbitre ne siffle pas et le jeu continue.',[
S('Continuer à jouer','Action poursuivie'),choice('Mettre volontairement le ballon dehors','fair_play',{ratingBonus:.12,goalChance:0,teamBoost:.08},'Arrêt fair-play'),T('Ralentir et laisser l’arbitre trancher','Temporisation fair-play')],{groups:['attacker','winger','midfielder'],weight:1,requiresOpponentDown:true}),
occ('OCC-086','Le gardien est très avancé sur le corner','Sur le corner, le gardien s’est positionné loin de sa ligne et laisse une trajectoire inhabituelle disponible.',[
R('Tenter directement le but depuis le corner','Corner direct sur gardien avancé'),C('Jouer le corner normalement','Corner classique'),T('Feinter le centre pour changer la trajectoire','Feinte sur corner')],{groups:['winger','midfielder','defender','attacker'],weight:1,setPiece:true,requiresSetPieceTaker:true}),
occ('OCC-087','Le capitaine réclame ce ballon','Ton capitaine te demande le ballon pour tenter de battre un record personnel alors que l’occasion reste ouverte.',[
C('Lui céder le ballon','Passe au capitaine'),S('Conclure toi-même','Frappe malgré la demande'),T('Attendre une fraction pour juger la meilleure option','Lecture avant décision')],{groups:['attacker','winger','midfielder'],weight:1,requiresCaptainRecord:true}),
occ('OCC-088','Tu te sais probablement hors-jeu','Tu as le sentiment d’être parti trop tôt, mais aucun drapeau ne se lève.',[
S('Continuer et conclure','Finition malgré doute hors-jeu'),choice('Signaler la situation à l’arbitre','fair_play',{ratingBonus:.08,goalChance:0,teamBoost:.03},'Hors-jeu signalé'),R('Jouer immédiatement sans te retourner','Finition instinctive')],{groups:['attacker','winger','midfielder'],weight:1,requiresLikelyOffside:true}),
occ('OCC-089','Ton numéro est déjà affiché','Le panneau de remplacement montre ton numéro. Avant de sortir, une dernière action se présente.',[
R('Tout donner sur cette ultime action','Dernier effort avant sortie'),S('Jouer simple avant de sortir','Dernier geste sûr'),C('Impliquer un partenaire dans la suite','Passe avant remplacement')],{groups:['attacker','winger','midfielder','defender'],weight:2,requiresPendingSubstitution:true}),
occ('OCC-090','Le grand pont t’a lancé','Ton grand pont vient d’éliminer ton défenseur direct et tu as maintenant le but devant toi.',[
R('Accélérer immédiatement pour finir','Accélération après grand pont'),T('Ralentir pour mieux négocier la finition','Finition après grand pont'),R('Tenter encore un geste technique','Deuxième geste après grand pont')],{groups:['attacker','winger','midfielder'],weight:3,requiresDuelAdvantage:true}),
occ('OCC-091','Ton nom descend des tribunes','Le public scande ton nom juste avant que l’occasion n’arrive dans ta zone.',[
T('Te servir de cette énergie sans changer ton geste','Finition portée par le public'),S('Te couper du bruit et rester froid','Finition sous concentration'),R('Chercher immédiatement le geste fort','Geste sous clameur')],{groups:['attacker','winger','midfielder'],weight:1,requiresCrowdChant:true}),
occ('OCC-092','La passe du jeune arrive quand même','Un jeune partenaire tente une passe très audacieuse. Malgré le risque, elle te trouve dans une bonne zone.',[
R('Profiter immédiatement de son audace','Finition après passe risquée'),S('Sécuriser la suite de l’action','Contrôle après passe risquée'),C('Prolonger dans le même esprit créatif','Combinaison créative')],{groups:['attacker','winger','midfielder'],weight:1,requiresYoungTeammate:true}),
occ('OCC-093','Le jeu reprend après une longue coupure','Après plusieurs minutes d’arrêt, les jambes ont refroidi et le rythme repart brutalement.',[
R('Repartir immédiatement au rythme maximal','Reprise rapide après interruption'),S('Prendre le temps de retrouver les appuis','Reprise prudente'),T('Choisir un geste plus posé','Geste posé après interruption')],{groups:['attacker','winger','midfielder','defender'],weight:1,requiresLongStoppage:true}),
occ('OCC-094','Ta passe te revient par hasard','Ta propre tentative de passe est déviée et revient directement dans ta course, transformant l’action en occasion.',[
S('Profiter immédiatement du rebond','Frappe sur auto-déviation'),T('Contrôler avant d’ajuster','Contrôle après déviation'),R('Transformer ce hasard en geste technique','Enchaînement après déviation')],{groups:['attacker','winger','midfielder'],weight:2}),
occ('OCC-095','Ton meilleur ami te barre la route','Le dernier adversaire avant le but est justement quelqu’un avec qui tu as une vraie relation personnelle hors du terrain.',[
S('Jouer le duel comme contre n’importe qui','Duel sans état d’âme'),T('Hésiter une fraction avant d’agir','Duel sous émotion'),C('Chercher une solution propre sans le provoquer','Duel respectueux')],{groups:['attacker','winger','midfielder'],weight:1,requiresFriendOpponent:true}),
occ('OCC-096','Le dégagement arrive à trente mètres','Un ballon repoussé te revient en pleine course loin du but, avec une fenêtre pour frapper avant le replacement.',[
R('Reprendre directement de volée','Volée lointaine'),S('Contrôler puis progresser','Contrôle à trente mètres'),C('Trouver un relais plus proche','Relais après dégagement')],{groups:['attacker','winger','midfielder','defender'],weight:3}),
occ('OCC-097','Le dernier ballon de la saison','La saison entière arrive à sa dernière action. Ce ballon sera probablement le dernier avant les vacances.',[
R('Tout donner pour finir en beauté','Dernier geste de la saison'),S('Rester sobre jusqu’au bout','Dernier geste sûr'),C('Chercher à faire briller un partenaire','Dernière passe de la saison')],{groups:['attacker','winger','midfielder','defender'],weight:8,requiresSeasonFinalAction:true}),
occ('OCC-098','Le contact peut être exagéré','Le contact dans la surface est léger. Tu peux rester debout ou tenter d’influencer l’arbitre.',[
choice('Accentuer la chute','cunning',{ratingBonus:.04,goalChance:.06,technicalRisk:.2,cardRisk:.06},'Chute exagérée'),S('Rester debout et poursuivre','Action poursuivie honnêtement'),T('Tomber naturellement et laisser juger','Contact laissé à l’arbitre')],{groups:['attacker','winger','midfielder'],weight:2}),
occ('OCC-099','Le coach te crie l’inverse','Depuis le bord du terrain, le coach hurle une consigne qui semble contredire ta première lecture.',[
C('Suivre immédiatement la consigne','Consigne coach suivie'),S('Faire confiance à ta propre lecture','Lecture personnelle'),T('Chercher un compromis dans l’action','Compromis tactique')],{groups:['attacker','winger','midfielder','defender'],weight:1,requiresCoachInstruction:true}),
occ('OCC-100','Ton retour après suspension commence ici','Pour ton premier match depuis ta sanction, une occasion nette arrive très tôt dans ton retour.',[
R('Conclure avec assurance','Finition de retour'),S('Jouer sobrement','Retour maîtrisé'),C('Impliquer immédiatement le collectif','Passe de réintégration')],{groups:['attacker','winger','midfielder'],weight:2,requiresReturnFromSuspension:true})
]);
export default GOAL_OPPORTUNITY_CHOICES_V5;