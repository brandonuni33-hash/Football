// Street to Pro — Bibliothèque V1 de la petite voix intérieure.
// Cette couche ne décrit jamais l'action : elle exprime ce que le joueur ressent, espère, craint ou se raconte.
// Les entrées sont volontairement courtes et taguées pour permettre une sélection contextuelle.

const entry = (id, text, family, tags = [], intensity = 1, unique = false) => ({ id, text, family, tags, intensity, unique });

export const PLAYER_INNER_VOICE_LIBRARY = [
  // CONFIANCE
  entry('confidence_001','Donne-la-moi encore.','confidence',['match','confidence_high'],1),
  entry('confidence_002','Il ne peut plus me suivre.','confidence',['match','direct_opponent','confidence_high'],2),
  entry('confidence_003','Je l’ai.','confidence',['match','control'],1),
  entry('confidence_004','Encore une fois.','confidence',['match','momentum'],1),
  entry('confidence_005','Il recule maintenant.','confidence',['match','direct_opponent','duel_won'],1),
  entry('confidence_006','Je sens le match tourner.','confidence',['match','momentum'],2),
  entry('confidence_007','Aujourd’hui, tout sort comme je veux.','confidence',['match','form_high'],2),
  entry('confidence_008','Je peux leur faire mal à chaque ballon.','confidence',['match','attacker','confidence_high'],2),
  entry('confidence_009','Je veux le prochain ballon.','confidence',['match','confidence_high'],1),
  entry('confidence_010','Je suis dedans.','confidence',['match','flow'],1),
  entry('confidence_011','Pas besoin de forcer. Je les sens venir.','confidence',['match','calm','confidence_high'],1),
  entry('confidence_012','Je peux prendre ce match.','confidence',['match','important_match','confidence_high'],3),
  entry('confidence_013','Ils commencent à me chercher du regard.','confidence',['match','teammates','form_high'],2),
  entry('confidence_014','Je suis plus rapide dans ma tête qu’eux.','confidence',['match','midfielder','confidence_high'],2),
  entry('confidence_015','Je sais exactement ce que je veux faire.','confidence',['match','decision'],1),

  // DOUTE
  entry('doubt_001','Simple. Fais simple.','doubt',['match','confidence_low'],1),
  entry('doubt_002','Ne rate pas encore celle-là.','doubt',['match','after_mistake'],2),
  entry('doubt_003','Pourquoi je réfléchis autant ?','doubt',['match','confidence_low'],2),
  entry('doubt_004','Allez… retrouve ton jeu.','doubt',['match','confidence_low'],1),
  entry('doubt_005','Je sais faire ça.','doubt',['match','self_reassurance'],1),
  entry('doubt_006','Arrête de penser au ballon d’avant.','doubt',['match','after_mistake'],1),
  entry('doubt_007','J’ai une seconde. Pas plus.','doubt',['match','pressure'],1),
  entry('doubt_008','Pourquoi mes jambes paraissent lourdes maintenant ?','doubt',['match','fatigue','pressure'],2),
  entry('doubt_009','Ne te cache pas.','doubt',['match','confidence_low'],2),
  entry('doubt_010','Demande-la. Même après ça.','doubt',['match','after_mistake'],2),
  entry('doubt_011','Je sens que j’hésite sur tout.','doubt',['match','confidence_low'],2),
  entry('doubt_012','Une bonne action. Juste une pour repartir.','doubt',['match','confidence_low'],2),
  entry('doubt_013','Je ne veux pas sortir comme ça.','doubt',['match','substitution_risk'],2),
  entry('doubt_014','Est-ce que le coach voit tout ça ?','doubt',['match','coach','confidence_low'],2),
  entry('doubt_015','Respire. Le match n’est pas fini.','doubt',['match','pressure','calm'],1),

  // EGO / AMBITION — tonalité shonen
  entry('ego_001','Je veux finir meilleur buteur.','ego',['career','scorer','ambition'],2),
  entry('ego_002','Je veux que mon nom soit tout en haut.','ego',['career','ranking','ambition'],3),
  entry('ego_003','S’il en marque deux, j’en marque trois.','ego',['career','rival_scorer','ambition'],3),
  entry('ego_004','Je ne suis pas venu jusqu’ici pour être deuxième.','ego',['career','competition','ambition'],3),
  entry('ego_005','Un jour, ils parleront de moi comme du meilleur.','ego',['career','legacy','ambition'],3),
  entry('ego_006','Je veux ce trophée.','ego',['career','award','ambition'],2),
  entry('ego_007','Encore un. Puis encore un.','ego',['match','goal_scored','scorer'],2),
  entry('ego_008','Je veux qu’ils pensent à moi avant même le match.','ego',['career','reputation','attacker'],3),
  entry('ego_009','Pourquoi je ne serais pas le meilleur du championnat ?','ego',['career','form_high','ambition'],3),
  entry('ego_010','Aujourd’hui, je veux qu’il comprenne.','ego',['match','rival','direct_opponent'],3),
  entry('ego_011','Je veux être celui qu’on cherche quand ça brûle.','ego',['career','leader','ambition'],3),
  entry('ego_012','Les grands matchs doivent finir par porter mon nom.','ego',['career','important_match','legacy'],3),
  entry('ego_013','Je ne veux pas seulement jouer ici. Je veux compter ici.','ego',['career','new_club','ambition'],2),
  entry('ego_014','Je veux dépasser ce total.','ego',['career','record','scorer'],2),
  entry('ego_015','Je veux devenir impossible à ignorer.','ego',['career','reputation','ambition'],3),
  entry('ego_016','Ce ballon, je le veux pour moi.','ego',['match','decision','scorer'],2),
  entry('ego_017','Je dois être celui qui finit l’action.','ego',['match','decision','scorer','ego_high'],3),
  entry('ego_018','Je veux qu’on sorte d’ici en parlant de moi.','ego',['match','important_match','ego_high'],3),
  entry('ego_019','Il me reste combien de buts pour le rattraper ?','ego',['career','rival_scorer','ranking'],2),
  entry('ego_020','Le record existe pour être dépassé.','ego',['career','record','legacy'],3),
  entry('ego_021','Je veux ce numéro parce que je veux ce rôle.','ego',['career','squad_status','ambition'],2),
  entry('ego_022','Je ne veux plus être la promesse. Je veux être la référence.','ego',['career','star','ambition'],3),
  entry('ego_023','Je veux que les autres se demandent comment m’arrêter.','ego',['career','reputation','confidence_high'],3),
  entry('ego_024','Je ne veux pas juste gagner. Je veux dominer.','ego',['match','important_match','ego_high'],3),
  entry('ego_025','Je veux laisser quelque chose derrière moi.','ego',['career','legacy','late_career'],3),

  // EGO PAR POSTE
  entry('ego_position_001','Personne ne marque aujourd’hui.','ego',['match','goalkeeper','clean_sheet'],3),
  entry('ego_position_002','Pas une deuxième fois. Il ne passe plus.','ego',['match','defender','direct_opponent'],3),
  entry('ego_position_003','C’est moi qui décide du rythme.','ego',['match','midfielder','control'],2),
  entry('ego_position_004','Qu’ils me donnent un duel.','ego',['match','winger','direct_opponent'],2),
  entry('ego_position_005','Je veux cette surface pour moi.','ego',['match','striker','scorer'],3),
  entry('ego_position_006','Je veux qu’il déteste me voir arriver.','ego',['match','defender','duel'],3),
  entry('ego_position_007','Chaque sortie est à moi.','ego',['match','goalkeeper','aerial'],2),
  entry('ego_position_008','Le ballon doit passer par moi.','ego',['match','midfielder','leader'],2),
  entry('ego_position_009','Je vais lui faire vivre un long match.','ego',['match','winger','direct_opponent'],3),
  entry('ego_position_010','La prochaine occasion finit au fond.','ego',['match','striker','after_miss'],3),

  // ADVERSAIRE DIRECT / RIVALITÉ
  entry('opponent_001','Il attend encore mon crochet intérieur.','direct_opponent',['match','duel_memory'],2),
  entry('opponent_002','Il commence à reculer.','direct_opponent',['match','duel_won'],1),
  entry('opponent_003','Cette fois, il ne mordra pas.','direct_opponent',['match','duel_memory'],2),
  entry('opponent_004','Il m’a eu une fois. Pas deux.','direct_opponent',['match','duel_lost'],2),
  entry('opponent_005','Il veut me faire sortir du match.','direct_opponent',['match','provocation'],2),
  entry('opponent_006','Il regarde mes pieds maintenant.','direct_opponent',['match','duel_memory'],1),
  entry('opponent_007','Il ne sait plus de quel côté je vais partir.','direct_opponent',['match','duel_won','confidence_high'],2),
  entry('opponent_008','Je l’entends souffler derrière moi.','direct_opponent',['match','fatigue_opponent'],2),
  entry('opponent_009','Il me suit partout. Très bien.','direct_opponent',['match','marked_tightly'],2),
  entry('opponent_010','Il veut le contact. Je peux jouer avec ça.','direct_opponent',['match','physical_duel'],2),
  entry('opponent_011','Il s’énerve. Ne lui donne pas ce qu’il veut.','direct_opponent',['match','provocation','calm'],2),
  entry('opponent_012','Il s’énerve. Encore un duel et il craque.','direct_opponent',['match','provocation','ego_high'],3),
  entry('opponent_013','Je connais son premier pas maintenant.','direct_opponent',['match','duel_memory'],2),
  entry('opponent_014','Il protège toujours son pied fort.','direct_opponent',['match','defender','duel_memory'],2),
  entry('opponent_015','Je vais l’obliger à choisir.','direct_opponent',['match','duel','decision'],2),
  entry('opponent_016','Il pense m’avoir compris.','direct_opponent',['match','duel_memory'],2),
  entry('opponent_017','Je veux le reprendre tout de suite.','direct_opponent',['match','duel_lost','ego_high'],2),
  entry('opponent_018','Pas besoin de le battre à chaque fois. Une seule peut suffire.','direct_opponent',['match','calm','duel'],2),

  // AVANT UNE GROSSE OCCASION
  entry('chance_001','C’est maintenant.','big_chance',['match','chance'],3),
  entry('chance_002','Un contrôle. Une frappe.','big_chance',['match','chance','striker'],2),
  entry('chance_003','Il est sorti trop tôt.','big_chance',['match','chance','goalkeeper_read'],2),
  entry('chance_004','Le deuxième poteau est ouvert.','big_chance',['match','chance'],2),
  entry('chance_005','Je peux la donner…','big_chance',['match','chance','teammate_open'],2),
  entry('chance_006','Si je frappe, j’assume.','big_chance',['match','chance','decision'],3),
  entry('chance_007','Une seconde de plus et c’est fermé.','big_chance',['match','chance','pressure'],2),
  entry('chance_008','Je le sens avancer.','big_chance',['match','chance','goalkeeper_read'],2),
  entry('chance_009','Pas besoin de frapper fort.','big_chance',['match','chance','calm'],1),
  entry('chance_010','Il est seul à droite.','big_chance',['match','chance','teammate_open'],1),
  entry('chance_011','Je l’ai devant moi.','big_chance',['match','chance','goalkeeper_1v1'],2),
  entry('chance_012','Ne pense pas au classement maintenant.','big_chance',['match','chance','scorer_race','calm'],2),
  entry('chance_013','Si celle-là rentre, tout change.','big_chance',['match','important_match','chance'],3),
  entry('chance_014','Je veux la prendre.','big_chance',['match','chance','ego_high'],2),
  entry('chance_015','Fais le bon choix, pas le plus beau.','big_chance',['match','chance','collective'],2),

  // BUT
  entry('goal_001','J’ai marqué.','goal',['match','goal_scored'],2),
  entry('goal_002','Putain… j’ai marqué.','goal',['match','goal_scored','emotional'],3),
  entry('goal_003','C’est vraiment rentré.','goal',['match','goal_scored','young'],2),
  entry('goal_004','Je veux le ballon. On repart.','goal',['match','goal_scored','losing_or_draw'],2),
  entry('goal_005','Encore.','goal',['match','goal_scored','ego_high'],2),
  entry('goal_006','Celui-là, je vais m’en souvenir.','goal',['match','goal_scored','important_match'],3),
  entry('goal_007','Je l’avais vu avant même de recevoir.','goal',['match','goal_scored','confidence_high'],2),
  entry('goal_008','Ça y est.','goal',['match','goal_scored','relief'],2),
  entry('goal_009','Je veux en mettre un deuxième.','goal',['match','goal_scored','scorer','ego_high'],2),
  entry('goal_010','Ne t’enflamme pas. Il reste du temps.','goal',['match','goal_scored','calm'],1),
  entry('goal_011','Tout ce travail pour cette seconde.','goal',['match','goal_scored','career_memory'],3),
  entry('goal_012','Je savais qu’elle viendrait.','goal',['match','goal_scored','confidence_high'],2),

  // PREMIERS / MOMENTS UNIQUES
  entry('unique_001','C’est donc ça.','milestone',['career','first_career_goal'],3,true),
  entry('unique_002','Il y a vraiment autant de monde ?','milestone',['career','first_pro_match'],3,true),
  entry('unique_003','Ne regarde pas autour. Joue.','milestone',['career','first_big_stadium'],3,true),
  entry('unique_004','Ils comptent sur moi maintenant.','milestone',['career','first_captaincy'],3,true),
  entry('unique_005','Donc c’était vrai. Ils me veulent vraiment.','milestone',['career','first_pro_offer'],3,true),
  entry('unique_006','Mon nom est vraiment sur ce contrat.','milestone',['career','first_pro_contract'],3,true),
  entry('unique_007','Je suis titulaire. Pour de vrai.','milestone',['career','first_start'],3,true),
  entry('unique_008','Je viens d’entrer dans un autre monde.','milestone',['career','first_pro_match'],3,true),
  entry('unique_009','Je vais devoir mériter chaque minute ici.','milestone',['career','first_transfer'],2,true),
  entry('unique_010','Je n’oublierai jamais cette porte qui s’ouvre.','milestone',['career','academy_entry'],3,true),

  // ERREUR / CULPABILITÉ / RÉACTION
  entry('mistake_001','C’est pour moi.','mistake',['match','mistake'],2),
  entry('mistake_002','Cours. Rattrape-la.','mistake',['match','turnover'],2),
  entry('mistake_003','Pas maintenant…','mistake',['match','mistake','important_match'],2),
  entry('mistake_004','Oublie-la.','mistake',['match','mistake','calm'],1),
  entry('mistake_005','Ne baisse pas la tête.','mistake',['match','mistake'],2),
  entry('mistake_006','La prochaine est à moi.','mistake',['match','mistake','ego_high'],2),
  entry('mistake_007','Je viens de les mettre en danger.','mistake',['match','turnover'],2),
  entry('mistake_008','Je dois réparer ça.','mistake',['match','mistake','responsibility'],2),
  entry('mistake_009','Pas besoin de tout récupérer en une action.','mistake',['match','mistake','calm'],2),
  entry('mistake_010','Je le savais avant même qu’il parte. Mauvais choix.','mistake',['match','bad_decision'],2),
  entry('mistake_011','Regarde devant. Pas derrière.','mistake',['match','mistake','reset'],1),
  entry('mistake_012','S’ils marquent là-dessus, je vais la revoir longtemps.','mistake',['match','dangerous_turnover'],3),

  // GROS RATÉ
  entry('miss_001','Comment j’ai pu la mettre là ?','big_miss',['match','big_miss'],3),
  entry('miss_002','Elle était pour moi.','big_miss',['match','big_miss'],2),
  entry('miss_003','La prochaine. Pense à la prochaine.','big_miss',['match','big_miss','reset'],2),
  entry('miss_004','Je ne peux pas rater deux fois.','big_miss',['match','big_miss','ego_high'],3),
  entry('miss_005','Tout était ouvert.','big_miss',['match','big_miss'],2),
  entry('miss_006','Ne regarde pas le banc.','big_miss',['match','big_miss','coach'],2),
  entry('miss_007','Je la sens encore sur mon pied.','big_miss',['match','big_miss'],2),
  entry('miss_008','Ça devait rentrer.','big_miss',['match','big_miss'],2),
  entry('miss_009','Je veux exactement la même occasion.','big_miss',['match','big_miss','confidence_high'],2),
  entry('miss_010','Respire. Ce n’était qu’une action.','big_miss',['match','big_miss','calm'],1),

  // FATIGUE
  entry('fatigue_001','Mes jambes commencent à répondre moins vite.','fatigue',['match','fatigue'],2),
  entry('fatigue_002','Encore dix minutes. Tiens.','fatigue',['match','late_match'],2),
  entry('fatigue_003','Je récupère moins vite entre les courses.','fatigue',['match','fatigue'],1),
  entry('fatigue_004','Choisis tes courses maintenant.','fatigue',['match','fatigue','calm'],2),
  entry('fatigue_005','Pas question de sortir.','fatigue',['match','fatigue','ego_high'],2),
  entry('fatigue_006','Si je repars à fond, il faut que ce soit la bonne.','fatigue',['match','fatigue','decision'],2),
  entry('fatigue_007','Je sens les cuisses brûler.','fatigue',['match','fatigue'],2),
  entry('fatigue_008','Ne montre rien.','fatigue',['match','fatigue','ego_high'],2),
  entry('fatigue_009','Je peux encore faire une différence.','fatigue',['match','fatigue','confidence'],2),
  entry('fatigue_010','Mon prochain effort doit servir à quelque chose.','fatigue',['match','fatigue','decision'],2),

  // BLESSURE / RETOUR
  entry('injury_001','Ça tire.','injury',['match','pain'],2),
  entry('injury_002','Ce n’est peut-être rien.','injury',['match','pain','denial'],2),
  entry('injury_003','Je connais cette sensation.','injury',['match','pain','injury_history'],3),
  entry('injury_004','Pas encore.','injury',['match','pain','injury_history'],3),
  entry('injury_005','Dis-le au banc.','injury',['match','pain','cautious'],2),
  entry('injury_006','Encore une course pour voir.','injury',['match','pain','risk'],2),
  entry('injury_007','Je ne veux pas revivre les derniers mois.','injury',['career','return_from_injury'],3),
  entry('injury_008','Le genou tient. Joue.','injury',['match','return_from_injury'],3,true),
  entry('injury_009','Le premier contact est passé.','injury',['match','return_from_injury'],2),
  entry('injury_010','Arrête de protéger la jambe.','injury',['match','return_from_injury','confidence'],2),
  entry('injury_011','Je pensais à ce terrain chaque jour.','injury',['career','return_from_injury'],3),
  entry('injury_012','Je veux juste retrouver mon jeu.','injury',['career','rehab'],2),

  // BANC / STATUT
  entry('bench_001','Combien de temps je vais encore regarder les autres jouer ?','bench',['career','benched','frustration'],3),
  entry('bench_002','Mon numéro n’est toujours pas appelé.','bench',['match','benched'],2),
  entry('bench_003','Je dois être prêt quand même.','bench',['match','benched','professional'],1),
  entry('bench_004','Il attend quoi de plus ?','bench',['career','benched','coach_tension'],3),
  entry('bench_005','Ne montre pas que ça te touche.','bench',['career','benched','ego_high'],2),
  entry('bench_006','Je déteste cette sensation.','bench',['career','benched'],2),
  entry('bench_007','Une entrée peut suffire à tout changer.','bench',['match','substitute','ambition'],2),
  entry('bench_008','Je veux qu’il regrette de ne pas m’avoir mis dès le début.','bench',['match','substitute','ego_high'],3),
  entry('bench_009','Je dois comprendre pourquoi.','bench',['career','benched','calm'],2),
  entry('bench_010','Si ça continue, il faudra prendre une décision.','bench',['career','benched','transfer'],3),
  entry('bench_011','Je ne veux pas devenir invisible.','bench',['career','benched','ambition'],3),
  entry('bench_012','Regarde le match. Tu peux encore apprendre quelque chose.','bench',['match','benched','mature'],1),

  // COACH
  entry('coach_001','Il me regarde.','coach',['match','coach'],1),
  entry('coach_002','Il attend quelque chose de moi.','coach',['match','coach','responsibility'],2),
  entry('coach_003','Je sais exactement ce qu’il va me dire.','coach',['match','coach','relationship_close'],1),
  entry('coach_004','Pourquoi il détourne le regard ?','coach',['match','coach','relationship_tense'],2),
  entry('coach_005','Il m’a fait confiance. À moi de répondre.','coach',['match','coach','trust_high'],2),
  entry('coach_006','Je ne veux pas le décevoir.','coach',['career','coach','young'],2),
  entry('coach_007','Je ne joue pas pour lui plaire. Mais je veux qu’il voie.','coach',['career','coach','ego_high'],3),
  entry('coach_008','Premier ballon. Fais simple. Comme il disait.','coach',['match','first_coach_memory'],3),
  entry('coach_009','Il avait raison sur ça.','coach',['career','first_coach_memory'],2),
  entry('coach_010','J’aimerais savoir ce qu’il pense vraiment.','coach',['career','coach','uncertainty'],2),

  // FAMILLE / PROCHES
  entry('family_001','Maman a dû voir ça.','family',['match','young','family'],2),
  entry('family_002','J’espère qu’ils sont là.','family',['match','young','family'],1),
  entry('family_003','Je sais exactement où ils seraient en train de crier.','family',['career','family_memory'],2),
  entry('family_004','Ils ont supporté tout le reste. Celui-là est aussi pour eux.','family',['career','milestone','family'],3),
  entry('family_005','Je leur avais dit que j’y arriverais.','family',['career','success','family'],3),
  entry('family_006','Je n’ai pas envie qu’ils me voient comme ça.','family',['career','failure','family'],2),
  entry('family_007','Ils vont encore me dire que je ne mange pas assez.','family',['career','young','light'],1),
  entry('family_008','Avant, j’entendais ma famille depuis le bord du terrain.','family',['career','big_stadium','memory'],3),
  entry('family_009','Tout est allé tellement vite depuis ces dimanches-là.','family',['career','memory','late_career'],3),
  entry('family_010','Je veux qu’ils soient fiers, même si je ne le dis jamais.','family',['career','family'],2),

  // PRESSION / GRAND MATCH
  entry('pressure_001','Ne regarde pas autour. Joue.','pressure',['match','big_stadium'],2),
  entry('pressure_002','Tout le monde attend quelque chose.','pressure',['match','important_match'],3),
  entry('pressure_003','C’est le même ballon.','pressure',['match','important_match','calm'],2),
  entry('pressure_004','Mon cœur tape trop vite.','pressure',['match','important_match','young'],2),
  entry('pressure_005','Je voulais ce genre de match. Maintenant il est là.','pressure',['match','important_match','ambition'],3),
  entry('pressure_006','Ne joue pas l’événement. Joue l’action.','pressure',['match','important_match','calm'],2),
  entry('pressure_007','Une action peut rester longtemps ce soir.','pressure',['match','important_match'],3),
  entry('pressure_008','Je refuse de me cacher aujourd’hui.','pressure',['match','important_match','ego_high'],3),
  entry('pressure_009','Le bruit disparaît dès que je touche le ballon.','pressure',['match','big_stadium','flow'],2),
  entry('pressure_010','C’est pour ces matchs-là que j’ai fait tout le reste.','pressure',['match','important_match','career_memory'],3),

  // SCORE / FIN DE MATCH
  entry('score_001','Encore du temps.','score_state',['match','draw','late_match'],1),
  entry('score_002','On n’a pas besoin de devenir fous.','score_state',['match','leading','late_match'],2),
  entry('score_003','Il nous en faut un.','score_state',['match','losing','late_match'],2),
  entry('score_004','Chaque ballon commence à compter double.','score_state',['match','late_match','tight_score'],2),
  entry('score_005','Une seule action.','score_state',['match','late_match','tight_score'],2),
  entry('score_006','Ne donne rien maintenant.','score_state',['match','leading','defender','late_match'],2),
  entry('score_007','Je peux encore nous ramener.','score_state',['match','losing','confidence_high'],3),
  entry('score_008','Pas maintenant. Pas après tout ça.','score_state',['match','leading','late_match','pressure'],3),
  entry('score_009','Le prochain duel peut décider du match.','score_state',['match','late_match','direct_opponent'],3),
  entry('score_010','Je ne veux pas que ça se termine comme ça.','score_state',['match','losing','late_match'],3),

  // COLLECTIF VS EGO
  entry('collective_001','Il est mieux placé que moi.','collective',['match','teammate_open'],1),
  entry('collective_002','Le but, c’est qu’on gagne.','collective',['match','team_first'],2),
  entry('collective_003','Je dois lui donner… mais j’ai envie de la prendre.','collective',['match','teammate_open','ego_conflict'],3),
  entry('collective_004','S’il marque, c’est aussi mon action.','collective',['match','assist_chance','team_first'],2),
  entry('collective_005','Ils me font confiance pour choisir juste.','collective',['match','leader','decision'],2),
  entry('collective_006','Pas besoin d’être le héros à chaque fois.','collective',['match','team_first','calm'],2),
  entry('collective_007','Je veux la finir moi-même.','collective',['match','ego_conflict','scorer'],2),
  entry('collective_008','Si je la donne maintenant, il est seul.','collective',['match','teammate_open'],1),
  entry('collective_009','Est-ce que je joue le match… ou mon classement ?','collective',['match','scorer_race','ego_conflict'],3),
  entry('collective_010','Le bon choix doit passer avant mon nom.','collective',['match','team_first','mature'],2),

  // TRANSFERT / CONTRAT / AGENT
  entry('transfer_001','Ils me veulent vraiment.','transfer',['career','offer'],2),
  entry('transfer_002','Est-ce que je suis prêt à repartir de zéro ?','transfer',['career','offer','uncertainty'],3),
  entry('transfer_003','Si je pars, rien ne sera comme avant.','transfer',['career','offer','attachment'],3),
  entry('transfer_004','Je veux voir jusqu’où je peux aller.','transfer',['career','offer','ambition'],3),
  entry('transfer_005','Le salaire est énorme… mais est-ce que je vais jouer ?','transfer',['career','offer','role'],3),
  entry('transfer_006','Je ne veux pas choisir seulement avec l’argent.','transfer',['career','offer','mature'],2),
  entry('transfer_007','C’est peut-être la porte que j’attendais.','transfer',['career','offer','ambition'],2),
  entry('transfer_008','Je connais ma place ici. Là-bas, je devrai la gagner.','transfer',['career','offer','role'],3),
  entry('transfer_009','Mon agent parle déjà comme si j’étais parti.','transfer',['career','agent'],2),
  entry('transfer_010','Je veux entendre ce que le coach pense avant de décider.','transfer',['career','offer','coach'],2),
  entry('transfer_011','Et si je refuse et que ça ne revient jamais ?','transfer',['career','offer','fear'],3),
  entry('transfer_012','Je ne veux pas fuir. Je veux avancer.','transfer',['career','offer','ambition'],3),

  // MÉDIAS / RÉPUTATION
  entry('media_001','Ils parlent vraiment de moi ?','media',['career','first_media_attention'],2),
  entry('media_002','Ils n’étaient pas là quand personne ne regardait.','media',['career','media','ego'],3),
  entry('media_003','Ne lis pas tout.','media',['career','social_media','pressure'],1),
  entry('media_004','Pourquoi ce commentaire me reste en tête ?','media',['career','social_media','criticism'],2),
  entry('media_005','Ça fait du bien de lire ça. Trop peut-être.','media',['career','social_media','praise'],2),
  entry('media_006','Je veux que le terrain réponde pour moi.','media',['career','criticism','ego'],3),
  entry('media_007','Un bon match et tout le monde change d’avis.','media',['career','media','perspective'],2),
  entry('media_008','Ils veulent une phrase. Moi, je veux le prochain match.','media',['career','interview','ambition'],2),
  entry('media_009','Je dois apprendre à vivre avec ça aussi.','media',['career','media','star'],2),
  entry('media_010','Mon nom circule plus vite que moi.','media',['career','reputation','rising_star'],2),

  // JEUNE / DÉBUT DE CARRIÈRE
  entry('young_001','J’espère que je vais jouer.','young',['career','u15','pre_match'],1),
  entry('young_002','J’espère qu’on ne voit pas que je suis stressé.','young',['match','u15','pressure'],2),
  entry('young_003','Je veux juste toucher mon premier ballon proprement.','young',['match','u15','kickoff'],1),
  entry('young_004','Je connais presque tout le monde autour du terrain.','young',['career','u15','home'],1),
  entry('young_005','Si je marque, ils vont en parler toute la semaine.','young',['match','u15','chance'],2),
  entry('young_006','Le coach m’a mis titulaire.','young',['match','u15','first_start'],2),
  entry('young_007','Je veux montrer que j’ai ma place.','young',['career','u15','ambition'],2),
  entry('young_008','Un jour, je jouerai dans un vrai grand stade.','young',['career','u15','dream'],3),
  entry('young_009','Et si c’était vraiment le début de quelque chose ?','young',['career','u15','milestone'],3),
  entry('young_010','Je veux qu’on se souvienne de ce match demain au collège.','young',['career','u15','light'],2),

  // SOUVENIRS / CONTINUITÉ DE CARRIÈRE
  entry('memory_001','Avant, j’entendais ma mère depuis le bord du terrain.','memory',['career','big_stadium','early_career_memory'],3,true),
  entry('memory_002','À quinze ans, je pensais que devenir pro serait le plus difficile.','memory',['career','adversity','career_memory'],3,true),
  entry('memory_003','On se rentrait déjà dedans quand personne ne nous regardait.','memory',['match','old_rival','career_memory'],3,true),
  entry('memory_004','Il me regardait déjà jouer quand personne ne connaissait mon nom.','memory',['career','first_coach_memory'],3,true),
  entry('memory_005','Je me souviens du premier vestiaire. Il paraissait immense.','memory',['career','late_career','career_memory'],3,true),
  entry('memory_006','J’aurais voulu montrer ça au gamin que j’étais.','memory',['career','major_success','career_memory'],3,true),
  entry('memory_007','Tout ça a commencé avec des matchs que personne ne filmait.','memory',['career','star','early_career_memory'],3,true),
  entry('memory_008','J’ai déjà cru que tout était fini.','memory',['career','comeback','career_memory'],3,true),
  entry('memory_009','Il y a quelques années, j’aurais tremblé sur ce ballon.','memory',['match','mature','important_match'],3,true),
  entry('memory_010','Je sais combien de fois j’ai failli ne jamais arriver ici.','memory',['career','major_success','career_memory'],3,true),

  // REVANCHE / COLÈRE
  entry('revenge_001','Je n’ai pas oublié.','revenge',['match','rival','memory'],3),
  entry('revenge_002','Ils m’ont laissé partir. Très bien.','revenge',['match','former_club','ego'],3),
  entry('revenge_003','Je veux qu’ils voient ce qu’ils ont perdu.','revenge',['match','former_club','ego_high'],3),
  entry('revenge_004','Ne transforme pas ça en règlement de comptes.','revenge',['match','former_club','calm'],2),
  entry('revenge_005','Cette fois, je veux sortir du terrain sans regret.','revenge',['match','rival','important_match'],3),
  entry('revenge_006','Je connais encore leurs habitudes.','revenge',['match','former_club','memory'],2),
  entry('revenge_007','Je veux gagner ce duel plus que les autres.','revenge',['match','rival','direct_opponent'],3),
  entry('revenge_008','Ils pensent encore savoir qui je suis.','revenge',['match','former_club','career_growth'],3),
  entry('revenge_009','Pas besoin de parler.','revenge',['match','rival','calm'],2),
  entry('revenge_010','Le terrain répondra.','revenge',['match','rival','ego'],3),

  // GARDIEN
  entry('keeper_001','Je l’ai vu armer.','goalkeeper',['match','goalkeeper','shot'],2),
  entry('keeper_002','Reste grand.','goalkeeper',['match','goalkeeper','one_on_one'],2),
  entry('keeper_003','Il va ouvrir son pied.','goalkeeper',['match','goalkeeper','one_on_one'],2),
  entry('keeper_004','Pas de rebond.','goalkeeper',['match','goalkeeper','shot'],1),
  entry('keeper_005','Cette surface est à moi.','goalkeeper',['match','goalkeeper','aerial','ego'],3),
  entry('keeper_006','Tout le monde regarde le ballon. Moi, je dois voir le reste.','goalkeeper',['match','goalkeeper','organization'],2),
  entry('keeper_007','Une erreur et personne ne verra les dix arrêts d’avant.','goalkeeper',['match','goalkeeper','pressure'],3),
  entry('keeper_008','Je veux ce face-à-face.','goalkeeper',['match','goalkeeper','one_on_one','ego_high'],3),
  entry('keeper_009','Parle. Organise-les.','goalkeeper',['match','goalkeeper','leader'],2),
  entry('keeper_010','Aujourd’hui, rien ne passe.','goalkeeper',['match','goalkeeper','confidence_high'],3),

  // DÉFENSEUR
  entry('defender_001','Il ne passe pas une deuxième fois.','defender',['match','defender','direct_opponent'],3),
  entry('defender_002','Pas besoin de tacler. Garde-le devant.','defender',['match','defender','calm'],2),
  entry('defender_003','Il veut partir sur son pied fort.','defender',['match','defender','duel_read'],2),
  entry('defender_004','S’il contrôle dos au but, je suis déjà dessus.','defender',['match','defender','duel'],2),
  entry('defender_005','Je veux qu’il arrête de demander le ballon.','defender',['match','defender','ego_high'],3),
  entry('defender_006','Pas de faute ici.','defender',['match','defender','danger_zone'],2),
  entry('defender_007','Une intervention propre et on repart.','defender',['match','defender','calm'],1),
  entry('defender_008','Il fatigue. Continue à le coller.','defender',['match','defender','direct_opponent'],2),
  entry('defender_009','Je dois couvrir derrière lui.','defender',['match','defender','collective'],1),
  entry('defender_010','Ce duel est à moi.','defender',['match','defender','ego'],2),

  // MILIEU
  entry('midfield_001','Tourne avant qu’il arrive.','midfielder',['match','midfielder','between_lines'],2),
  entry('midfield_002','Une touche suffit.','midfielder',['match','midfielder','pressure'],1),
  entry('midfield_003','Je peux casser leur ligne maintenant.','midfielder',['match','midfielder','progression'],2),
  entry('midfield_004','Le rythme est trop rapide. Calme-le.','midfielder',['match','midfielder','control'],2),
  entry('midfield_005','Ils courent après le ballon. Fais-les encore courir.','midfielder',['match','midfielder','control'],2),
  entry('midfield_006','Je veux recevoir entre leurs lignes.','midfielder',['match','midfielder','ambition'],2),
  entry('midfield_007','Je l’ai vu partir.','midfielder',['match','midfielder','assist_chance'],2),
  entry('midfield_008','Pas besoin de toucher dix fois le ballon pour contrôler le match.','midfielder',['match','midfielder','mature'],2),
  entry('midfield_009','C’est moi qui dois donner la prochaine direction.','midfielder',['match','midfielder','leader'],3),
  entry('midfield_010','Je peux les faire reculer avec une seule passe.','midfielder',['match','midfielder','confidence_high'],2),

  // ATTAQUANT / AILIER
  entry('attacker_001','Il est trop près. Je peux partir dans son dos.','attacker',['match','striker','direct_opponent'],2),
  entry('attacker_002','Encore un appel. Même s’ils ne me la donnent pas.','attacker',['match','striker','movement'],2),
  entry('attacker_003','Le défenseur regarde le ballon.','attacker',['match','striker','movement'],1),
  entry('attacker_004','Je veux toucher ce ballon avant lui.','attacker',['match','striker','chance'],2),
  entry('attacker_005','Il me laisse la ligne.','attacker',['match','winger','direct_opponent'],1),
  entry('attacker_006','S’il ouvre ses hanches, je rentre intérieur.','attacker',['match','winger','duel_read'],2),
  entry('attacker_007','Je peux l’obliger à reculer encore.','attacker',['match','winger','confidence_high'],2),
  entry('attacker_008','Je veux le un contre un.','attacker',['match','winger','ego'],2),
  entry('attacker_009','Le deuxième poteau est vide.','attacker',['match','winger','chance'],2),
  entry('attacker_010','Une vraie occasion peut suffire.','attacker',['match','striker','patience'],2),

  // SUCCÈS / STAR
  entry('star_001','Ils réagissent avant même que je touche le ballon.','star',['career','star','crowd'],3),
  entry('star_002','Tout le monde attend que je fasse quelque chose.','star',['match','star','pressure'],3),
  entry('star_003','Avant, je voulais qu’on me remarque. Maintenant je voudrais parfois disparaître.','star',['career','star','pressure'],3),
  entry('star_004','Je dois apprendre à porter ça.','star',['career','star','responsibility'],3),
  entry('star_005','Une mauvaise soirée devient une histoire nationale maintenant.','star',['career','star','media'],3),
  entry('star_006','C’est le prix pour être là où je voulais être.','star',['career','star','perspective'],3),
  entry('star_007','Ils sont venus pour voir si je vais le faire encore.','star',['match','star','important_match'],3),
  entry('star_008','Je ne veux pas devenir prisonnier de ma réputation.','star',['career','star','identity'],3),

  // FIN DE CARRIÈRE / HÉRITAGE
  entry('legacy_001','Combien de matchs comme celui-là il me reste ?','legacy',['career','late_career'],3),
  entry('legacy_002','Mon corps récupère moins vite qu’avant.','legacy',['career','late_career','fatigue'],2),
  entry('legacy_003','Je vois des gamins faire les mêmes rêves que moi.','legacy',['career','late_career','youth'],3),
  entry('legacy_004','Je ne veux pas que la dernière image soit une mauvaise saison.','legacy',['career','late_career','ego'],3),
  entry('legacy_005','Je veux partir en sachant que j’ai tout pris de cette carrière.','legacy',['career','retirement','legacy'],3),
  entry('legacy_006','J’ai passé ma vie à attendre le prochain match.','legacy',['career','retirement'],3,true),
  entry('legacy_007','Bientôt, il n’y aura plus de prochain match.','legacy',['career','retirement'],3,true),
  entry('legacy_008','Je pensais que ce moment serait plus simple.','legacy',['career','retirement'],3,true),
  entry('legacy_009','Est-ce qu’on se souviendra vraiment de moi ?','legacy',['career','retirement','legacy'],3,true),
  entry('legacy_010','Je me souviendrai surtout de ce que personne n’a vu.','legacy',['career','retirement','memory'],3,true),
  entry('legacy_011','J’ai été ce gamin. Puis ce joueur. Puis tout le reste.','legacy',['career','retirement','identity'],3,true),
  entry('legacy_012','Je crois que j’ai enfin compris : je ne courais pas seulement après les trophées.','legacy',['career','retirement','perspective'],3,true)
];

export const INNER_VOICE_FAMILIES = Object.freeze([
  'confidence','doubt','ego','direct_opponent','big_chance','goal','milestone','mistake','big_miss','fatigue','injury','bench','coach','family','pressure','score_state','collective','transfer','media','young','memory','revenge','goalkeeper','defender','midfielder','attacker','star','legacy'
]);

export function getInnerVoiceEntries({ family = null, tags = [], maxIntensity = 3, includeUnique = true } = {}) {
  const required = Array.isArray(tags) ? tags : [tags].filter(Boolean);
  return PLAYER_INNER_VOICE_LIBRARY.filter(item => {
    if (family && item.family !== family) return false;
    if (Number(item.intensity || 1) > maxIntensity) return false;
    if (!includeUnique && item.unique) return false;
    return required.every(tag => item.tags.includes(tag));
  });
}

export function countInnerVoiceEntries() {
  return PLAYER_INNER_VOICE_LIBRARY.length;
}

export default PLAYER_INNER_VOICE_LIBRARY;
