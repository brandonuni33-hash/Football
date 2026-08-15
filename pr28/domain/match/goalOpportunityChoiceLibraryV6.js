// Street to Pro — occasions de but jouables V6 (OCC-101 à OCC-120).
const choice=(text,style,impacts={},gesture=null)=>({text,style,impacts,gesture});
const occ=(id,title,description,choices,meta={})=>({id,title,description,choices,...meta});
const S=(t,g)=>choice(t,'safe',{ratingBonus:.15,goalChance:.20,technicalRisk:.08},g);
const T=(t,g)=>choice(t,'technical',{ratingBonus:.19,goalChance:.23,technicalRisk:.14},g);
const R=(t,g)=>choice(t,'spectacular',{ratingBonus:.24,goalChance:.20,technicalRisk:.23},g);
const C=(t,g)=>choice(t,'collective',{ratingBonus:.17,assistChance:.20,passAccuracy:.09},g);
export const GOAL_OPPORTUNITY_CHOICES_V6=Object.freeze([
occ('OCC-101','Ton but vient d’être refusé','La frustration du hors-jeu précédent est encore là lorsqu’une nouvelle occasion se présente presque immédiatement.',[
R('Répondre tout de suite par un geste fort','Réaction après but refusé'),S('Te recentrer avant de finir','Finition après recentrage'),choice('Précipiter le geste sous l’émotion','emotional',{ratingBonus:.07,goalChance:.16,technicalRisk:.22},'Frappe sous frustration')],{groups:['attacker','winger','midfielder'],weight:2,requiresRecentDisallowedGoal:true}),
occ('OCC-102','Le tacle de ton partenaire libère le ballon','Un tacle dur mais propre te remet directement dans la course vers le but.',[
S('Continuer sans te retourner','Transition après tacle'),T('Jeter un œil à l’arbitre avant de poursuivre','Lecture après tacle'),R('Accélérer pour profiter immédiatement de l’avantage','Accélération après tacle')],{groups:['attacker','winger','midfielder'],weight:2,requiresHardTeammateTackle:true}),
occ('OCC-103','La caméra est braquée sur toi','Une caméra de télévision suit précisément ton action au moment où l’occasion devient dangereuse.',[
S('Ignorer totalement la caméra','Finition sous caméra'),T('Garder conscience du contexte sans changer ton geste','Finition sous exposition'),R('Chercher le geste qui fera l’image','Geste pour la caméra')],{groups:['attacker','winger','midfielder'],weight:1,requiresBroadcastCamera:true}),
occ('OCC-104','La passe traverse les jambes du défenseur','Ton partenaire glisse une passe entre les jambes d’un défenseur et le ballon arrive dans ta course.',[
S('Conclure immédiatement','Finition après petit pont collectif'),T('Contrôler avant de finir proprement','Contrôle après petit pont collectif'),R('Ajouter ton propre geste technique','Enchaînement spectaculaire')],{groups:['attacker','winger','midfielder'],weight:2}),
occ('OCC-105','Il te parle juste avant le geste','Ton défenseur direct essaie de te déconcentrer verbalement au moment où l’occasion s’ouvre.',[
S('Ignorer la provocation','Finition sous provocation'),choice('Répondre avant d’agir','emotional',{ratingBonus:.05,goalChance:.12,technicalRisk:.18},'Réponse verbale'),R('Transformer la colère en accélération','Réaction à la provocation')],{groups:['attacker','winger','midfielder'],weight:2,requiresOpponentProvocation:true}),
occ('OCC-106','Son jaune change le duel','Le défenseur vient d’être averti et hésite désormais à intervenir aussi fort.',[
S('Profiter immédiatement de l’espace','Attaque sur défenseur averti'),C('Construire plus patiemment','Patience contre averti'),choice('Chercher à provoquer une nouvelle faute','cunning',{ratingBonus:.13,goalChance:.07,duelBonus:.08,technicalRisk:.14},'Provocation du second jaune')],{groups:['attacker','winger','midfielder'],weight:2,requiresMarkedOpponentBooked:true}),
occ('OCC-107','Un flash te coupe la vision','Un flash éclate au bord du terrain au moment précis où tu prépares ta finition.',[
S('Poursuivre sans changer ton geste','Finition malgré flash'),choice('Perdre un instant le ballon des yeux','hesitant',{ratingBonus:.02,goalChance:.1,technicalRisk:.22},'Gêne visuelle'),T('Ralentir pour te réajuster','Réajustement après flash')],{groups:['attacker','winger','midfielder'],weight:1,requiresPhotoFlash:true}),
occ('OCC-108','Ils se gênent entre eux','Deux défenseurs se trompent dans leur communication et laissent soudain l’espace libre devant toi.',[
S('Profiter immédiatement de la confusion','Frappe sur erreur de communication'),T('Prendre le temps de choisir la meilleure finition','Finition calme sur erreur'),C('Servir un partenaire pour exploiter encore mieux l’erreur','Passe sur désorganisation')],{groups:['attacker','winger','midfielder'],weight:3}),
occ('OCC-109','Ton genou te rappelle le choc','Une gêne légère au genou revient au moment où tu dois armer ton geste.',[
R('Ignorer la douleur et frapper normalement','Frappe malgré gêne'),S('Adapter ton geste pour ménager le genou','Frappe adaptée'),C('Chercher une solution moins exigeante physiquement','Passe sous gêne physique')],{groups:['attacker','winger','midfielder'],weight:1,requiresKneeDiscomfort:true}),
occ('OCC-110','Tu sais qu’un recruteur est là','La présence d’un recruteur étranger est un fait connu avant le match. L’occasion se présente sous son regard.',[
R('Tenter un geste ambitieux','Geste sous observation'),S('Jouer sobrement et efficacement','Finition sobre sous observation'),T('Ignorer sa présence et suivre ta lecture habituelle','Finition sans calcul')],{groups:['attacker','winger','midfielder'],weight:1,requiresKnownScout:true}),
occ('OCC-111','Votre automatisme dépasse les mots','La communication avec ce partenaire reste difficile, mais sa passe est parfaitement dosée.',[
S('Conclure sans casser l’action','Finition après connexion nouvelle'),T('Chercher brièvement son regard avant de poursuivre','Connexion visuelle'),C('Prolonger encore la combinaison avec lui','Combinaison malgré barrière')],{groups:['attacker','winger','midfielder'],weight:1,requiresLanguageBarrierTeammate:true}),
occ('OCC-112','Le mouvement travaillé apparaît','La séquence qui vient de s’ouvrir est exactement celle répétée toute la semaine à l’entraînement.',[
C('Exécuter fidèlement le plan','Schéma entraîné'),R('Improviser une variante au dernier moment','Improvisation sur schéma'),S('Choisir la solution la plus sûre','Sécurisation du schéma')],{groups:['attacker','winger','midfielder','defender'],weight:2,requiresTrainedPattern:true}),
occ('OCC-113','Le match est déjà plié','Ton équipe mène largement et cette nouvelle occasion arrive sans la pression du résultat.',[
R('Tenter un geste gratuit pour le plaisir','Geste match plié'),S('Rester sérieux et finir proprement','Finition sérieuse'),C('Donner l’occasion à un partenaire moins servi','Passe généreuse')],{groups:['attacker','winger','midfielder'],weight:2,requiresBigLead:true}),
occ('OCC-114','Le ballon paraît anormalement mou','Au contact, tu sens que le ballon est légèrement dégonflé mais l’action continue.',[
S('Frapper normalement','Frappe ballon mou'),T('Adapter la puissance','Frappe compensée ballon mou'),T('Privilégier le placement','Placement ballon mou')],{groups:['attacker','winger','midfielder'],weight:1,requiresSoftBall:true}),
occ('OCC-115','Le signe du coach est clair','Le coach fait un geste discret depuis le banc qui correspond à une consigne connue de l’équipe.',[
C('Suivre immédiatement le signal','Consigne silencieuse suivie'),S('Faire confiance à ta propre lecture','Lecture malgré signal'),choice('Hésiter entre les deux','hesitant',{ratingBonus:.06,goalChance:.13,technicalRisk:.17},'Hésitation tactique')],{groups:['attacker','winger','midfielder','defender'],weight:1,requiresCoachSignal:true}),
occ('OCC-116','La touche te prend de vitesse','Une remise en jeu très rapide change brutalement le rapport de force et te place dans une bonne zone.',[
R('Réagir à l’instinct','Action après touche rapide'),T('Prendre une seconde pour lire','Lecture après touche rapide'),C('Chercher immédiatement un appui','Appui après touche rapide')],{groups:['attacker','winger','midfielder'],weight:2}),
occ('OCC-117','Toute la ligne perd ses appuis','Sur une pelouse instable, plusieurs défenseurs glissent presque au même moment et laissent plusieurs solutions ouvertes.',[
S('Profiter tout de suite du chaos','Finition sur glissade collective'),T('Choisir calmement la meilleure option','Lecture du chaos'),C('Servir un partenaire dans l’espace','Passe sur chaos défensif')],{groups:['attacker','winger','midfielder'],weight:1,requiresWetPitch:true}),
occ('OCC-118','Ton corps est encore entre deux rythmes','Tu reviens de sélection et les sensations du club ne sont pas encore totalement revenues.',[
R('Forcer le geste malgré le décalage','Finition retour sélection'),S('Jouer plus simple','Geste simple retour sélection'),C('T’appuyer davantage sur le collectif','Passe retour sélection')],{groups:['attacker','winger','midfielder','defender'],weight:1,requiresNationalTeamReturn:true}),
occ('OCC-119','Un enfant crie ton prénom','Au bord de l’action, tu entends distinctement un enfant t’appeler par ton prénom.',[
T('Sourire intérieurement et rester focalisé','Finition sous émotion positive'),S('Couper complètement le bruit','Finition concentrée'),R('Chercher à lui offrir un beau geste','Geste pour le public')],{groups:['attacker','winger','midfielder'],weight:1,requiresChildCallingPlayer:true}),
occ('OCC-120','Le club entre dans une nouvelle ère','C’est le premier match d’un nouveau projet de club et tout ce qui se passe aujourd’hui prend une valeur symbolique particulière.',[
R('Chercher à marquer immédiatement cette nouvelle histoire','Geste nouvelle ère'),S('Jouer exactement comme d’habitude','Finition sans contexte'),C('Partager la responsabilité avec le collectif','Action collective nouvelle ère')],{groups:['attacker','winger','midfielder','defender'],weight:1,requiresNewClubEra:true})
]);
export default GOAL_OPPORTUNITY_CHOICES_V6;