// Street to Pro — extensions V2 de la petite voix intérieure.
// Ton volontairement brut : pensées très courtes, réactions immédiates et sensations physiques.

const thought = (id, text, family, tags = [], intensity = 1, depth = 'situational') => ({
  id, text, family, tags, intensity, depth
});

export const PLAYER_INNER_VOICE_ADDITIONS_V2 = [
  // MICRO-RÉFLEXES BRUTS
  thought('raw_001','Putain.','micro',['match','intense'],1,'micro'),
  thought('raw_002','Putain…','micro',['match','shock'],1,'micro'),
  thought('raw_003','Sérieux ?','micro',['match','surprise'],1,'micro'),
  thought('raw_004','Aïe.','pain',['match','pain','contact'],1,'micro'),
  thought('raw_005','Ça pique.','pain',['match','pain','contact'],1,'micro'),
  thought('raw_006','Pas maintenant…','micro',['match','pressure'],1,'micro'),
  thought('raw_007','Respire.','micro',['match','fatigue','pressure'],1,'micro'),
  thought('raw_008','Encore.','micro',['match','momentum'],1,'micro'),

  // RATÉ / CULPABILITÉ / RESPONSABILITÉ
  thought('miss_pressure_001','J’avais pas le droit de rater.','big_miss',['match','big_miss','important_match','guilt'],3,'situational'),
  thought('miss_pressure_002','Pas celle-là. Pas comme ça.','big_miss',['match','big_miss','important_match'],3,'micro'),
  thought('miss_pressure_003','Celle-là devait finir au fond.','big_miss',['match','big_miss','chance'],2,'situational'),
  thought('miss_pressure_004','Je pouvais pas gâcher ça.','big_miss',['match','big_miss','guilt'],3,'situational'),
  thought('miss_pressure_005','Tout le monde avait fait le plus dur.','big_miss',['match','big_miss','team'],3,'situational'),
  thought('miss_pressure_006','C’était à moi de finir.','big_miss',['match','big_miss','responsibility'],3,'situational'),
  thought('miss_pressure_007','Je vais la revoir longtemps, celle-là.','big_miss',['match','big_miss','memory'],3,'situational'),
  thought('miss_pressure_008','Oublie. Tout de suite.','big_miss',['match','big_miss','reset'],2,'micro'),
  thought('miss_pressure_009','Je veux exactement la même.','big_miss',['match','big_miss','ego','resilience'],3,'situational'),
  thought('miss_pressure_010','La prochaine, je la mets.','big_miss',['match','big_miss','ego_high'],3,'situational'),

  // ÉPUISEMENT / TOUT DONNER
  thought('spent_001','J’ai tout dépensé.','fatigue',['match','fatigue','late_match','exhausted'],3,'micro'),
  thought('spent_002','J’ai plus rien dans les jambes.','fatigue',['match','fatigue','exhausted'],3,'situational'),
  thought('spent_003','J’ai tout donné sur celle-là.','fatigue',['match','fatigue','sprint'],2,'situational'),
  thought('spent_004','Encore une course et je sais pas ce qu’il reste derrière.','fatigue',['match','fatigue','late_match'],3,'situational'),
  thought('spent_005','Mes jambes sont vides.','fatigue',['match','fatigue','exhausted'],2,'micro'),
  thought('spent_006','Je peux pas courir partout maintenant.','fatigue',['match','fatigue','decision'],2,'situational'),
  thought('spent_007','Faut que je garde quelque chose pour la prochaine.','fatigue',['match','fatigue','decision'],2,'situational'),
  thought('spent_008','Une dernière accélération. Après, on verra.','fatigue',['match','fatigue','late_match','resilience'],3,'situational'),

  // DÉFI / REVANCHE / PROUVER
  thought('prove_001','Je vais leur montrer.','ego',['career','criticism','revenge','ambition'],3,'situational'),
  thought('prove_002','Ils vont voir.','ego',['career','criticism','revenge'],2,'micro'),
  thought('prove_003','Qu’ils continuent à parler.','ego',['career','criticism','media'],2,'situational'),
  thought('prove_004','Je veux qu’ils regrettent d’avoir douté.','ego',['career','criticism','revenge'],3,'career'),
  thought('prove_005','Pas besoin de répondre maintenant. Le terrain répondra.','ego',['career','criticism','calm','revenge'],3,'career'),
  thought('prove_006','Je retiens tout.','ego',['career','criticism','memory'],2,'micro'),
  thought('prove_007','Ce match, je le veux pour moi.','ego',['match','important_match','revenge'],3,'situational'),
  thought('prove_008','Ils pensent que je vais disparaître ? Très bien.','ego',['career','criticism','ego_high'],3,'career'),
  thought('prove_009','Je veux voir leur tête après.','ego',['match','revenge','rival'],3,'situational'),

  // DOULEUR / CONTACT
  thought('pain_001','Aïe.','pain',['match','pain','contact'],1,'micro'),
  thought('pain_002','Ça, je l’ai senti.','pain',['match','pain','contact'],2,'situational'),
  thought('pain_003','Il m’a pas raté.','pain',['match','pain','physical_duel'],2,'situational'),
  thought('pain_004','Ça va passer.','pain',['match','pain','denial'],1,'micro'),
  thought('pain_005','Bouge. Teste.','pain',['match','pain','self_check'],2,'micro'),
  thought('pain_006','Non… ça tire encore.','pain',['match','pain','injury_risk'],3,'situational'),
  thought('pain_007','Fais pas le héros.','pain',['match','pain','cautious'],2,'situational'),
  thought('pain_008','Je peux continuer. Enfin… je crois.','pain',['match','pain','uncertainty'],3,'situational'),

  // PROVOCATION / MÉFIANCE / ADVERSAIRE DIRECT
  thought('provocation_001','Il veut quoi, lui ?','direct_opponent',['match','provocation','direct_opponent'],2,'micro'),
  thought('provocation_002','Pourquoi il vient me parler maintenant ?','direct_opponent',['match','provocation','direct_opponent'],2,'situational'),
  thought('provocation_003','Il essaie de me faire sortir du match.','direct_opponent',['match','provocation','direct_opponent'],3,'situational'),
  thought('provocation_004','Continue de parler.','direct_opponent',['match','provocation','ego_high'],2,'micro'),
  thought('provocation_005','Il cherche une réaction.','direct_opponent',['match','provocation','calm'],2,'situational'),
  thought('provocation_006','Ne lui donne pas ce qu’il veut.','direct_opponent',['match','provocation','calm'],2,'situational'),
  thought('provocation_007','La prochaine fois, gagne le duel. Pas la discussion.','direct_opponent',['match','provocation','mature'],3,'situational'),
  thought('provocation_008','Il veut jouer à ça ? D’accord.','direct_opponent',['match','provocation','ego_high','rivalry'],3,'situational'),

  // REGARD / MALAISE / INTIMIDATION
  thought('stare_001','Pourquoi il me regarde comme ça ?','social_read',['match','stare','uncertainty'],2,'micro'),
  thought('stare_002','Il me fixe depuis tout à l’heure.','social_read',['match','stare','direct_opponent'],2,'situational'),
  thought('stare_003','J’ai fait quoi ?','social_read',['match','stare','uncertainty'],1,'micro'),
  thought('stare_004','Il essaie de m’intimider.','social_read',['match','stare','direct_opponent','provocation'],2,'situational'),
  thought('stare_005','Ne baisse pas les yeux.','social_read',['match','stare','ego'],2,'micro'),
  thought('stare_006','Laisse-le regarder.','social_read',['match','stare','calm'],2,'micro'),
  thought('stare_007','Il attend que je doute.','social_read',['match','stare','pressure'],3,'situational'),
  thought('stare_008','Pourquoi le coach me regarde comme ça ?','social_read',['match','coach','stare','uncertainty'],2,'situational'),

  // CHALEUR / MÉTÉO / CORPS
  thought('weather_001','Il fait chaud aujourd’hui.','weather',['match','hot_weather'],1,'micro'),
  thought('weather_002','Cette chaleur va peser en deuxième mi-temps.','weather',['match','hot_weather','fatigue'],2,'situational'),
  thought('weather_003','J’ai déjà la bouche sèche.','weather',['match','hot_weather','fatigue'],2,'situational'),
  thought('weather_004','Le maillot colle déjà.','weather',['match','hot_weather'],1,'micro'),
  thought('weather_005','Faut pas partir trop vite avec cette chaleur.','weather',['match','hot_weather','decision'],2,'situational'),
  thought('weather_006','Je sens que chaque sprint coûte plus cher.','weather',['match','hot_weather','fatigue'],2,'situational'),
  thought('weather_007','Trouve de l’air dès que le jeu s’arrête.','weather',['match','hot_weather','fatigue'],2,'situational'),
  thought('weather_008','Aujourd’hui, il faudra gagner aussi contre la chaleur.','weather',['match','hot_weather','important_match'],3,'situational')
];

export default PLAYER_INNER_VOICE_ADDITIONS_V2;
