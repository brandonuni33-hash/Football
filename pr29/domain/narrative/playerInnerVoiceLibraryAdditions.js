// Street to Pro — extensions de la bibliothèque de petite voix intérieure.
// Origine : formulations utilisateur corrigées + déclinaisons écrites à partir de leur intention.
// Trois niveaux : micro-réflexe, situationnel, carrière.

const thought = (id, text, family, tags = [], intensity = 1, depth = 'situational', unique = false) => ({
  id, text, family, tags, intensity, depth, unique
});

export const PLAYER_INNER_VOICE_ADDITIONS = [
  // RÊVE / ASCENSION / INCRÉDULITÉ
  thought('dream_001','Enfin… mon rêve peut se réaliser.','dream',['career','dream','opportunity'],3,'career'),
  thought('dream_002','Ça devient réel.','dream',['career','dream','milestone'],2,'micro'),
  thought('dream_003','J’y suis presque.','dream',['career','dream','progress'],2,'micro'),
  thought('dream_004','C’est peut-être vraiment possible.','dream',['career','dream','hope'],2,'situational'),
  thought('dream_005','Tout ce travail pour arriver jusque-là…','dream',['career','dream','work'],3,'career'),
  thought('dream_006','Je l’ai imaginé tellement de fois.','dream',['career','dream','milestone'],3,'career'),
  thought('dream_007','C’est pour ça que j’ai commencé.','dream',['career','dream','memory'],3,'career'),
  thought('dream_008','Je veux pas me réveiller.','dream',['career','dream','milestone'],2,'situational'),
  thought('dream_009','Encore un peu. Je suis presque là.','dream',['career','dream','progress'],2,'situational'),
  thought('dream_010','Je peux vraiment y arriver.','dream',['career','dream','confidence'],3,'career'),
  thought('dream_011','C’est peut-être le début de tout.','dream',['career','young','milestone'],3,'career'),
  thought('dream_012','Je veux juste réussir.','dream',['career','young','ambition'],1,'career'),
  thought('dream_013','Je peux devenir pro.','dream',['career','young','ambition'],2,'career'),
  thought('dream_014','Je peux devenir l’un des meilleurs.','dream',['career','ambition','ego'],3,'career'),
  thought('dream_015','Je veux devenir le meilleur.','dream',['career','ambition','ego_high'],3,'career'),
  thought('dream_016','Je veux qu’ils se souviennent de moi.','dream',['career','legacy','ego'],3,'career'),

  // ÉTONNEMENT / DÉCOUVERTE DE SOI
  thought('self_surprise_001','Quel truc de malade !','self_surprise',['match','unexpected','success'],2,'micro'),
  thought('self_surprise_002','C’est fou.','self_surprise',['match','unexpected'],1,'micro'),
  thought('self_surprise_003','C’est fou ce qui vient de se passer.','self_surprise',['match','unexpected','big_moment'],2,'situational'),
  thought('self_surprise_004','C’est moi qui viens de faire ça… ?','self_surprise',['match','unexpected','success'],3,'situational'),
  thought('self_surprise_005','J’ai vraiment réussi ça ?','self_surprise',['match','unexpected','success'],2,'situational'),
  thought('self_surprise_006','Je savais même pas que j’avais ça en moi.','self_surprise',['match','unexpected','growth'],3,'career'),
  thought('self_surprise_007','Attends… c’était moi, ça ?','self_surprise',['match','unexpected','success'],2,'micro'),
  thought('self_surprise_008','Comment j’ai fait ça ?','self_surprise',['match','unexpected','success'],2,'micro'),
  thought('self_surprise_009','Même moi, je l’avais pas vu venir.','self_surprise',['match','unexpected','success'],2,'situational'),
  thought('self_surprise_010','Je crois que je viens de passer un cap.','self_surprise',['career','growth','milestone'],3,'career'),
  thought('self_surprise_011','Depuis quand je sais faire ça ?','self_surprise',['match','unexpected','technical_success'],2,'micro'),
  thought('self_surprise_012','J’ai jamais réussi ça à l’entraînement.','self_surprise',['match','unexpected','technical_success'],2,'situational'),
  thought('self_surprise_013','Je veux revoir cette action.','self_surprise',['match','unexpected','success'],1,'micro'),
  thought('self_surprise_014','Ça… je savais pas que j’en étais capable.','self_surprise',['match','unexpected','growth'],3,'situational'),

  // CONFIRMATION / VITESSE / SUPÉRIORITÉ RESSENTIE
  thought('confirmation_001','Je savais que j’étais plus rapide.','confidence',['match','speed','duel_won'],2,'situational'),
  thought('confirmation_002','Je le savais.','confidence',['match','confirmation'],1,'micro'),
  thought('confirmation_003','Il peut pas suivre.','confidence',['match','speed','direct_opponent','duel_won'],2,'micro'),
  thought('confirmation_004','Je l’avais senti dès le premier duel.','confidence',['match','direct_opponent','duel_memory'],2,'situational'),
  thought('confirmation_005','Sur dix mètres, il me prend jamais.','confidence',['match','speed','direct_opponent'],2,'situational'),
  thought('confirmation_006','Il recule avant même que je parte.','confidence',['match','direct_opponent','confidence_high'],2,'situational'),
  thought('confirmation_007','Il sait que je peux le déposer.','confidence',['match','direct_opponent','speed','ego'],2,'situational'),
  thought('confirmation_008','Encore une course et il va commencer à douter.','confidence',['match','direct_opponent','speed'],3,'situational'),
  thought('confirmation_009','Je peux lui faire ça toute la soirée.','confidence',['match','direct_opponent','ego_high'],3,'situational'),

  // ÉMOTION INATTENDUE
  thought('emotion_001','Je ne pensais pas le ressentir aussi fort.','emotion',['career','milestone','emotional'],3,'career'),
  thought('emotion_002','Je pensais être prêt.','emotion',['career','milestone','pressure'],2,'situational'),
  thought('emotion_003','Pourquoi ça me touche autant ?','emotion',['career','milestone','emotional'],3,'career'),
  thought('emotion_004','J’avais imaginé ce moment autrement.','emotion',['career','milestone','emotional'],3,'career'),
  thought('emotion_005','Je pensais que je serais plus calme.','emotion',['match','important_match','emotional'],2,'situational'),
  thought('emotion_006','J’arrive pas à arrêter de sourire.','emotion',['career','success','joy'],2,'micro'),
  thought('emotion_007','J’ai la gorge serrée.','emotion',['career','milestone','emotional'],2,'micro'),
  thought('emotion_008','C’est beaucoup plus fort que dans ma tête.','emotion',['career','milestone','emotional'],3,'career'),
  thought('emotion_009','Je pensais que ce serait juste un match.','emotion',['match','important_match','emotional'],3,'career'),
  thought('emotion_010','Je vais me souvenir de ça toute ma vie.','emotion',['career','milestone','memory'],3,'career',true),

  // EXIGENCE / PROGRESSION / ENTRAÎNEMENT
  thought('growth_001','Je dois m’améliorer.','growth',['career','training','ambition'],2,'career'),
  thought('growth_002','C’est pas encore assez.','growth',['career','ambition','ego'],2,'micro'),
  thought('growth_003','Je peux faire beaucoup mieux.','growth',['career','ambition','self_demand'],2,'situational'),
  thought('growth_004','Il me manque encore quelque chose.','growth',['career','training','self_demand'],2,'career'),
  thought('growth_005','Je dois travailler ça.','growth',['career','training','after_mistake'],1,'situational'),
  thought('growth_006','Demain, je recommence.','growth',['career','training','resilience'],2,'situational'),
  thought('growth_007','Si je veux aller plus haut, ça doit devenir automatique.','growth',['career','training','ambition'],3,'career'),
  thought('growth_008','Les meilleurs ne ratent pas ça.','growth',['match','after_mistake','ego'],3,'situational'),
  thought('growth_009','Je veux plus refaire cette erreur.','growth',['match','after_mistake','training'],2,'situational'),
  thought('growth_010','Je dois passer un cap.','growth',['career','ambition','development'],3,'career'),
  thought('growth_011','Si je veux être le meilleur, je peux pas me contenter de ça.','growth',['career','ego_high','ambition'],3,'career'),
  thought('training_payoff_001','L’entraînement a payé.','growth',['match','training_payoff','success'],2,'situational'),
  thought('training_payoff_002','Ça, je l’ai travaillé cent fois.','growth',['match','training_payoff','success'],2,'situational'),
  thought('training_payoff_003','Exactement comme à l’entraînement.','growth',['match','training_payoff','success'],2,'situational'),
  thought('training_payoff_004','Toutes ces répétitions pour ce ballon-là.','growth',['match','training_payoff','big_moment'],3,'career'),
  thought('training_payoff_005','Enfin.','growth',['match','training_payoff','relief'],1,'micro'),
  thought('training_payoff_006','Je savais que ça finirait par sortir en match.','growth',['match','training_payoff','confidence'],2,'situational'),
  thought('training_payoff_007','Je l’ai assez répété pour ne plus réfléchir.','growth',['match','training_payoff','flow'],2,'situational'),
  thought('training_payoff_008','Le travail commence à se voir.','growth',['career','training_payoff','development'],2,'career'),
  thought('training_payoff_009','Ça n’est pas arrivé par hasard.','growth',['career','training_payoff','success'],2,'career'),

  // FAMILLE / RESPONSABILITÉ
  thought('family_duty_001','Je dois le faire pour les miens.','family',['career','family','responsibility'],3,'career'),
  thought('family_duty_002','Je joue pas seulement pour moi.','family',['career','family','responsibility'],3,'career'),
  thought('family_duty_003','Ils ont trop donné pour moi.','family',['career','family','sacrifice'],3,'career'),
  thought('family_duty_004','Je veux qu’ils soient fiers.','family',['career','family','motivation'],2,'career'),
  thought('family_duty_005','Je veux leur rendre tout ça.','family',['career','family','sacrifice'],3,'career'),
  thought('family_duty_006','Ils étaient là avant que tout commence.','family',['career','family','memory'],3,'career'),
  thought('family_duty_007','Je dois aller au bout pour eux.','family',['career','family','responsibility'],3,'career'),
  thought('family_duty_008','Je sais pourquoi je fais tout ça.','family',['career','family','motivation'],2,'career'),
  thought('family_duty_009','Ils regardent sûrement.','family',['match','family','young'],1,'micro'),
  thought('family_duty_010','Pas question de lâcher maintenant.','family',['match','family','resilience'],2,'situational'),

  // ADVERSAIRE FORT / DUEL QUI ÉVOLUE
  thought('strong_opponent_001','Sérieux ? Il me l’a prise.','direct_opponent',['match','duel_lost','surprise'],2,'micro'),
  thought('strong_opponent_002','Comment il m’a pris ce ballon ?','direct_opponent',['match','duel_lost','surprise'],2,'situational'),
  thought('strong_opponent_003','Il avait lu mon geste.','direct_opponent',['match','duel_lost','duel_memory'],2,'situational'),
  thought('strong_opponent_004','D’accord… lui, il sait défendre.','direct_opponent',['match','duel_lost','respect'],2,'situational'),
  thought('strong_opponent_005','Je pensais l’avoir passé.','direct_opponent',['match','duel_lost','surprise'],2,'situational'),
  thought('strong_opponent_006','Il m’attendait.','direct_opponent',['match','duel_lost','duel_memory'],1,'micro'),
  thought('strong_opponent_007','Je l’ai sous-estimé.','direct_opponent',['match','duel_lost','respect'],2,'situational'),
  thought('strong_opponent_008','Il est plus rapide que je pensais.','direct_opponent',['match','duel_lost','speed','respect'],2,'situational'),
  thought('strong_opponent_009','Ça va être un vrai duel.','direct_opponent',['match','duel_lost','rivalry'],3,'situational'),
  thought('strong_opponent_010','D’accord…','direct_opponent',['match','duel_lost'],1,'micro'),
  thought('strong_opponent_011','Il commence à me comprendre.','direct_opponent',['match','duel_lost','duel_memory'],2,'situational'),
  thought('strong_opponent_012','Je dois changer quelque chose.','direct_opponent',['match','duel_lost','adaptation'],2,'situational'),
  thought('strong_opponent_013','Voilà. Maintenant il va réfléchir.','direct_opponent',['match','duel_won','rivalry'],3,'situational'),
  thought('respect_001','Il est vraiment fort.','respect',['match','strong_opponent'],2,'micro'),
  thought('respect_002','Putain, il est fort.','respect',['match','strong_opponent','intense'],2,'micro'),
  thought('respect_003','Ok… lui, c’est pas pareil.','respect',['match','strong_opponent'],2,'situational'),
  thought('respect_004','Je comprends mieux sa réputation.','respect',['match','reputation','strong_opponent'],2,'situational'),
  thought('respect_005','Chaque erreur contre lui se paie.','respect',['match','strong_opponent','pressure'],3,'situational'),
  thought('respect_006','Il voit tout plus vite.','respect',['match','strong_opponent','reading'],2,'situational'),
  thought('respect_007','Il me force à réfléchir.','respect',['match','strong_opponent','adaptation'],2,'situational'),
  thought('respect_008','Je dois élever mon niveau.','respect',['match','strong_opponent','ambition'],3,'situational'),
  thought('respect_009','C’est contre ce genre de joueur que je veux me mesurer.','respect',['career','strong_opponent','ambition'],3,'career'),
  thought('respect_010','Si je veux aller plus haut, je dois battre des joueurs comme lui.','respect',['career','strong_opponent','ego'],3,'career'),
  thought('respect_011','Il est fort. Tant mieux.','respect',['match','strong_opponent','ego'],3,'micro'),
  thought('reputation_001','Sa réputation était pas volée.','respect',['match','reputation','strong_opponent'],2,'situational'),
  thought('reputation_002','Ok… maintenant je comprends.','respect',['match','reputation'],2,'micro'),
  thought('reputation_003','Les vidéos ne mentaient pas.','respect',['match','reputation','known_opponent'],2,'situational'),
  thought('reputation_004','Il est encore meilleur en vrai.','respect',['match','reputation','strong_opponent'],3,'situational'),
  thought('reputation_005','Chaque fois qu’il touche le ballon, quelque chose se passe.','respect',['match','reputation','star_opponent'],3,'situational'),
  thought('reputation_006','Donc c’est ça, le niveau au-dessus.','respect',['match','reputation','level_up'],3,'career'),
  thought('reputation_007','Je comprends pourquoi tout le monde parle de lui.','respect',['match','reputation','star_opponent'],2,'situational'),
  thought('reputation_008','Je veux voir jusqu’où je peux aller contre lui.','respect',['match','reputation','rivalry','ambition'],3,'situational'),
  thought('reputation_009','Il est fort. Mais il n’est pas intouchable.','respect',['match','reputation','ego','rivalry'],3,'situational'),

  // FATIGUE
  thought('fatigue_user_001','Je commence à fatiguer.','fatigue',['match','fatigue'],1,'micro'),
  thought('fatigue_user_002','Mes jambes deviennent lourdes.','fatigue',['match','fatigue'],2,'situational'),
  thought('fatigue_user_003','Je récupère moins vite.','fatigue',['match','fatigue'],1,'situational'),
  thought('fatigue_user_004','Encore dix minutes.','fatigue',['match','fatigue','late_match'],2,'micro'),
  thought('fatigue_user_005','Respire.','fatigue',['match','fatigue','pressure'],1,'micro'),
  thought('fatigue_user_006','Je sens mes cuisses tirer.','fatigue',['match','fatigue','physical'],2,'situational'),
  thought('fatigue_user_007','J’arrive plus à repartir pareil.','fatigue',['match','fatigue','speed'],2,'situational'),
  thought('fatigue_user_008','Je dois choisir mes courses maintenant.','fatigue',['match','fatigue','decision'],2,'situational'),
  thought('fatigue_user_009','Pas question qu’il voie que je suis cuit.','fatigue',['match','fatigue','direct_opponent','ego'],3,'situational'),
  thought('fatigue_user_010','Je peux encore faire une accélération.','fatigue',['match','fatigue','speed','resilience'],2,'situational'),
  thought('fatigue_user_011','Une dernière. J’en ai encore une.','fatigue',['match','fatigue','late_match','resilience'],3,'situational'),

  // PRESSION / LASSITUDE
  thought('pressure_wear_001','J’en ai marre de toute cette pression.','pressure',['career','pressure','frustration'],3,'career'),
  thought('pressure_wear_002','J’en peux plus qu’on attende toujours quelque chose de moi.','pressure',['career','pressure','star'],3,'career'),
  thought('pressure_wear_003','Même quand je gagne, c’est jamais assez.','pressure',['career','pressure','expectations'],3,'career'),
  thought('pressure_wear_004','Pourquoi tout devient aussi lourd ?','pressure',['career','pressure','fatigue_mental'],3,'career'),
  thought('pressure_wear_005','J’aimerais juste jouer.','pressure',['career','pressure','fatigue_mental'],2,'career'),
  thought('pressure_wear_006','Avant, le football était plus simple.','pressure',['career','pressure','memory'],3,'career'),
  thought('pressure_wear_007','J’ai l’impression que tout le monde me regarde.','pressure',['career','pressure','star'],2,'situational'),
  thought('pressure_wear_008','Je peux plus faire une erreur tranquille.','pressure',['career','pressure','media'],3,'career'),
  thought('pressure_wear_009','Ils parlent de moi comme s’ils me connaissaient.','pressure',['career','pressure','media'],3,'career'),
  thought('pressure_wear_010','J’ai besoin de respirer.','pressure',['career','pressure','fatigue_mental'],2,'micro'),
  thought('pressure_feed_001','C’est exactement pour ça que je voulais être ici.','pressure',['career','pressure','ego','ambition'],3,'career'),

  // FRUSTRATION COÉQUIPIER / PASSE NON FAITE
  thought('teammate_frustration_001','Pourquoi il me l’a pas donnée ?','teammate_frustration',['match','teammate','missed_pass'],2,'micro'),
  thought('teammate_frustration_002','J’étais tout seul.','teammate_frustration',['match','teammate','missed_pass'],2,'micro'),
  thought('teammate_frustration_003','Il m’a vu, j’en suis sûr.','teammate_frustration',['match','teammate','missed_pass'],2,'situational'),
  thought('teammate_frustration_004','Pourquoi il force ça ?','teammate_frustration',['match','teammate','bad_choice'],2,'situational'),
  thought('teammate_frustration_005','Donne-la plus tôt !','teammate_frustration',['match','teammate','missed_pass'],2,'micro'),
  thought('teammate_frustration_006','Encore une fois il m’ignore.','teammate_frustration',['match','teammate','missed_pass','repeat'],3,'situational'),
  thought('teammate_frustration_007','Il joue pour lui ou quoi ?','teammate_frustration',['match','teammate','ego_conflict'],3,'situational'),
  thought('teammate_frustration_008','La prochaine, je lui dis.','teammate_frustration',['match','teammate','tension'],2,'situational'),
  thought('teammate_frustration_009','Calme-toi. Continue l’appel.','teammate_frustration',['match','teammate','calm'],2,'situational'),

  // MICRO-RÉFLEXES GÉNÉRAUX
  thought('micro_001','Sérieux ?','micro',['match','surprise'],1,'micro'),
  thought('micro_002','Putain.','micro',['match','intense'],1,'micro'),
  thought('micro_003','Encore.','micro',['match','ego','momentum'],1,'micro'),
  thought('micro_004','Pas maintenant.','micro',['match','pressure'],1,'micro'),
  thought('micro_005','Je le savais.','micro',['match','confirmation'],1,'micro'),
  thought('micro_006','Enfin.','micro',['match','relief'],1,'micro'),
  thought('micro_007','C’est fou.','micro',['match','surprise'],1,'micro')
];

export const INNER_VOICE_ADDITION_FAMILIES = Object.freeze([
  'dream','self_surprise','confidence','emotion','growth','family','direct_opponent','respect','fatigue','pressure','teammate_frustration','micro'
]);

export default PLAYER_INNER_VOICE_ADDITIONS;
