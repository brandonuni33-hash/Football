# Compatibilité sauvegarde PR9

Une sauvegarde possédant une ancienne `activeMatchSession` doit être normalisée vers le flow v3 au chargement/à la prochaine avancée: version, moments, index courant, tableaux décisions/événements et modificateurs reçoivent des valeurs sûres sans supprimer les faits déjà présents. La migration ne doit pas inventer un résultat ni terminer le match.
