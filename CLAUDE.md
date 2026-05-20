# DentalPrep
App mobile de révision pour l'examen CNQAOS (concours dentaire français).
Repo : https://github.com/Quentin1312/Dentalprep

## Démarrage de session
Au début de chaque session, lire immédiatement ces fichiers sans attendre qu'on te le demande :
1. `src/app/layout.tsx` — layout racine
2. `src/lib/app-context.tsx` — état global, types Profile/Course/Attempt, cache localStorage 5 min
3. `src/types/database.ts` — types Supabase générés
4. `supabase-schema.sql` — schéma complet des tables

## Stack
- Next.js 14 App Router
- Supabase : auth + tables `profiles`, `quiz_attempts`, `daily_sessions`, `courses`, `quiz_questions`
- CSS inline uniquement — zéro Tailwind, zéro className externe
- Vercel (deploy)
- Claude API + Groq (`src/lib/groq.ts`) pour Quiz Flash (OCR → flashcards/QCM)

## Structure clé
```
src/
  app/(app)/        # Pages protégées (dashboard, quiz, library, stats…)
  app/auth/         # Login / signup / callback
  app/setup/        # Choix du compagnon (définitif)
  app/api/          # Routes API : generate, ocr, quick-scan
  components/pet/   # PetCompanion.tsx — animations idle/correct/wrong/thinking
  lib/
    app-context.tsx # AppContext — source de vérité, toujours passer par là
    supabase/       # client.ts / server.ts / middleware.ts
    xp.ts           # Calcul XP et niveaux 1–5
    badges.ts       # 12 badges débloquables
    modules.ts      # Définition modules M1–M6+
    recordSession.ts# Enregistrement daily_sessions + streak
  types/database.ts # Types Supabase
```

## Règles importantes
- **CSS inline uniquement** — ne jamais proposer Tailwind, CSS Modules ou className externe
- **AppContext obligatoire** — ne jamais fetch Supabase directement depuis un composant, toujours passer par `useAppContext()` ou `refresh()`
- **Schéma BDD** — lister les tables impactées avant toute modif, ne pas toucher sans accord explicite

## Ce qu'il ne faut pas toucher
- `src/app/setup/page.tsx` — choix du compagnon, définitif une fois fait
- `src/lib/xp.ts` — formule XP/niveaux calibrée
- `src/lib/badges.ts` — logique des 12 badges
- Tri des questions dans `quiz/[moduleId]/QuizClient.tsx` — questions ratées en premier
- Clients Supabase (`src/lib/supabase/`) — ne pas modifier

## Comportement attendu
- Proposer un plan avant toute nouvelle feature
- Si une modif touche la BDD : lister les tables impactées avant de coder
- Pas de tests sauf si demandé explicitement
- Si ambigu : demander, ne pas assumer
