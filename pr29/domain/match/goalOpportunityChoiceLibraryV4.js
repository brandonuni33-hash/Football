// Street to Pro — occasions de but jouables V4 (OCC-061 à OCC-080).
const choice=(text,style,impacts={},gesture=null)=>({text,style,impacts,gesture});
const occ=(id,title,description,choices,meta={})=>({id,title,description,choices,...meta});
const S=(t,g)=>choice(t,'safe',{ratingBonus:.15,goalChance:.20,technicalRisk:.08},g);
const T=(t,g)=>choice(t,'technical',{ratingBonus:.19,goalChance:.23,technicalRisk:.14},g);
const R=(t,g)=>choice(t,'spectacular',{ratingBonus:.24,goalChance:.20,technicalRisk:.23},g);
const C=(t,g)=>choice(t,'collective',{ratingBonus:.17,assistChance:.20,passAccuracy:.09},g);
export const GOAL_OPPORTUNITY_CHOICES_V4=Object.freeze([
occ('OCC-061','Tu arrives jusqu’à la ligne de but','Ton débordement t’emmène jusqu’à la ligne de fond. Tu peux centrer ou rentrer toi-même dans la surface.',[
C('Mettre un centre tendu au premier poteau','Centre premier poteau'),C('Lever vers le second poteau','Centre second poteau'),R('Rentrer dans la surface pour frapper','Retour intérieur et frappe')],{groups:['winger','attacker','midfielder'],weight:4}),
occ('OCC-062','Dos au but sous pression','Le ballon arrive dans tes pieds dos au but. Un défenseur physique colle chacun de tes appuis.',[
C('Remettre en une touche','Remise une touche'),T('Pivoter rapidement pour te retourner','Pivot rapide'),S('Protéger et temporiser','Protection de balle')],{groups:['attacker','midfielder'],weight:4}),
occ('OCC-063','L’interception te lance','Tu coupes une passe et pars immédiatement vers le but avant que le bloc adverse se replace.',[
R('Accélérer au maximum','Percée après interception'),T('Contrôler le rythme de ta course','Conduite maîtrisée'),C('Chercher un soutien pendant la course','Relais après interception')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-064','Le gardien relance devant toi','Le gardien adverse tente une relance risquée au pied dans sa propre surface, à quelques mètres de toi.',[
R('Presser immédiatement le gardien','Pressing sur gardien'),T('Anticiper la trajectoire de sa passe','Interception anticipée'),S('Garder une distance pour éviter la faute','Pressing contrôlé')],{groups:['attacker','winger','midfielder'],weight:3}),
occ('OCC-065','Perdu, puis regagné aussitôt','La perte de balle déclenche un contre-pressing immédiat et tu récupères de nouveau dans une position idéale.',[
S('Frapper immédiatement','Frappe après contre-pressing'),T('Contrôler pour assurer','Contrôle après reconquête'),C('Chercher un dernier soutien','Passe après reconquête')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-066','L’extérieur du pied te trouve','Une passe extérieure du pied inattendue traverse la ligne adverse et arrive parfaitement dans ta course.',[
S('Frapper directement','Frappe sur extérieur du pied'),T('Contrôler avant de replacer','Contrôle sur passe extérieure'),R('Ajouter un geste technique','Enchaînement technique')],{groups:['attacker','winger','midfielder'],weight:3}),
occ('OCC-067','La rafale change la trajectoire','Une rafale pousse soudainement le ballon dans ton sens au moment où tu prépares ton geste.',[
S('Profiter de l’effet sans surcorriger','Frappe aidée par le vent'),T('Compenser techniquement','Frappe compensée'),R('Tenter un geste plus ambitieux','Frappe ambitieuse avec vent')],{groups:['attacker','winger','midfielder'],weight:1,requiresStrongWind:true}),
occ('OCC-068','Deux appels, un hors-jeu possible','Deux partenaires lancent leur course. L’un paraît à la limite de la ligne, l’autre est plus sûr.',[
R('Jouer vers le partenaire à la limite','Passe profondeur risquée'),C('Choisir l’appel le plus sûr','Passe profondeur sûre'),S('Continuer seul','Conduite sans passe')],{groups:['attacker','winger','midfielder'],weight:3}),
occ('OCC-069','Le gardien glisse','Le gardien perd brutalement son appui et le but s’ouvre presque entièrement.',[
S('Frapper immédiatement','Frappe sur glissade gardien'),T('Ajuster calmement','Finition placée but ouvert'),S('Contourner avant de conclure','Contournement de sécurité')],{groups:['attacker','winger','midfielder'],weight:2,requiresWetPitch:true}),
occ('OCC-070','Un dernier défenseur devant le but vide','Le gardien est éliminé. Un seul défenseur reste entre toi et le but vide.',[
T('Tenter le dribble direct','Dribble dernier défenseur'),C('Servir le partenaire mieux placé','Passe devant but vide'),choice('Provoquer le contact','cunning',{ratingBonus:.09,goalChance:.06,technicalRisk:.18},'Contact recherché')],{groups:['attacker','winger','midfielder'],weight:3}),
occ('OCC-071','Le dégagement de la tête te revient','Un défenseur repousse le centre de la tête, mais le ballon retombe directement à l’entrée de la surface.',[
R('Frapper immédiatement en puissance','Frappe sur deuxième ballon'),T('Contrôler puis placer','Contrôle deuxième ballon'),R('Enchaîner par un geste plus élaboré','Enchaînement deuxième ballon')],{groups:['attacker','winger','midfielder','defender'],weight:4}),
occ('OCC-072','Ton partenaire te crie de tirer','Un coéquipier te demande de frapper alors que ton premier instinct était de centrer.',[
S('Suivre son appel et tirer','Tir sur appel du partenaire'),C('Centrer selon ta propre lecture','Centre maintenu'),T('Feinter le centre avant de tirer','Feinte de centre et frappe')],{groups:['winger','midfielder','attacker'],weight:3}),
occ('OCC-073','Chaque appui est un duel','Le défenseur reste collé à ton dos et dispute physiquement chaque mouvement.',[
R('Forcer le passage','Passage en force'),T('T’écarter pour créer l’espace','Décrochage mobile'),choice('Te laisser tomber pour chercher la faute','cunning',{ratingBonus:.06,goalChance:.03,technicalRisk:.2,cardRisk:.04},'Simulation de contact')],{groups:['attacker','midfielder'],weight:3}),
occ('OCC-074','Deux défenseurs déjà éliminés','Tu viens d’éliminer deux joueurs par des gestes techniques. Un troisième défenseur arrive devant toi.',[
R('Tenter encore un petit pont','Troisième geste technique'),C('Changer de registre et jouer simple','Passe après festival'),S('Frapper avant le prochain duel','Frappe après dribbles')],{groups:['attacker','winger','midfielder'],weight:2,requiresDuelAdvantage:true}),
occ('OCC-075','Coup franc indirect dans la surface','L’arbitre accorde un coup franc indirect dans la surface. Tout doit se jouer à plusieurs.',[
R('Frapper juste après une remise rapide','Frappe sur coup franc indirect'),C('Exécuter la combinaison préparée','Combinaison indirecte'),C('Décaler en retrait pour ouvrir l’angle','Remise en retrait indirecte')],{groups:['attacker','winger','midfielder','defender'],weight:1,setPiece:true,requiresSetPieceTaker:true,requiresIndirectFreeKick:true}),
occ('OCC-076','Le mouvement en une touche te trouve','Trois passes rapides en une touche cassent le bloc et le ballon finit dans tes pieds.',[
S('Frapper sans casser le rythme','Frappe après une-touche'),T('Prendre une touche pour assurer','Contrôle après combinaison'),C('Ajouter encore une passe','Passe supplémentaire')],{groups:['attacker','winger','midfielder'],weight:4}),
occ('OCC-077','La lumière baisse','Une partie de l’éclairage faiblit pendant quelques secondes et la visibilité devient moins nette.',[
R('Frapper malgré tout','Frappe sous faible visibilité'),S('Ralentir pour mieux voir','Temporisation sous éclairage faible'),C('Chercher un appui sûr','Passe sous éclairage faible')],{groups:['attacker','winger','midfielder'],weight:1,requiresLightingIssue:true}),
occ('OCC-078','Une occasion à la 110e','La prolongation a vidé les jambes. Malgré tout, une vraie occasion s’ouvre et le match peut basculer maintenant.',[
T('Puiser dans tes dernières ressources pour finir proprement','Finition en prolongation'),S('Jouer simple pour ne pas gâcher','Geste sûr en prolongation'),C('Servir un partenaire plus frais','Passe en prolongation')],{groups:['attacker','winger','midfielder','defender'],weight:8,requiresExtraTime:true,requiresFatigue:true}),
occ('OCC-079','La main n’est pas sifflée','Le ballon semble toucher le bras d’un défenseur. Aucun coup de sifflet ne vient et l’action reste favorable.',[
S('Continuer et frapper','Frappe après main non sifflée'),choice('T’arrêter pour protester','emotional',{ratingBonus:-.08,goalChance:0,technicalRisk:.04},'Protestation'),R('Accélérer l’action avant toute interruption','Action poursuivie rapidement')],{groups:['attacker','winger','midfielder'],weight:2,requiresPossibleHandball:true}),
occ('OCC-080','La relance de ton gardien te lance','Ton gardien envoie un long ballon parfaitement dosé dans ta course, derrière le premier rideau adverse.',[
T('Contrôler orienté avant d’accélérer','Contrôle sur relance longue'),R('Reprendre directement de volée','Volée sur relance gardien'),C('Temporiser pour laisser remonter les soutiens','Temporisation après relance')],{groups:['attacker','winger','midfielder'],weight:3})
]);
export default GOAL_OPPORTUNITY_CHOICES_V4;