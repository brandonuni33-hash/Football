# Street to Pro — mise en ligne de la landing bêta

Le code est prêt pour Vercel + Supabase. Les secrets Supabase ne sont jamais envoyés au navigateur.

## 1. Supabase

1. Créer un projet Supabase.
2. Ouvrir SQL Editor.
3. Exécuter `supabase/migrations/001_beta_signups.sql`.
4. Dans Project Settings > API, récupérer :
   - Project URL
   - service_role key (secret — ne jamais la publier)

## 2. Vercel

1. Importer le dépôt GitHub `brandonuni33-hash/Football` dans Vercel.
2. Ajouter les variables d'environnement :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Déployer.
4. Vercel fournit une URL publique en `*.vercel.app`.

## 3. Test

Ouvrir l'URL Vercel et réserver une carrière avec une adresse de test. Vérifier ensuite la ligne dans Supabase > Table Editor > `beta_signups`.

Tester aussi un lien TikTok : `?utm_source=tiktok&utm_campaign=first1000`.

## Données collectées

- email (unique)
- plateforme : PC / iOS / Android
- source marketing
- campagne
- date d'inscription

## Sécurité

La table utilise RLS et n'a aucune policy publique. Seule la fonction serveur `/api/signup` utilise la clé `service_role`. La vraie clé ne doit jamais être ajoutée au dépôt GitHub ou au JavaScript du navigateur.
