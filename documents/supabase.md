# Migration SQLite → Supabase PostgreSQL — Compte rendu

## Résumé

Migration complète de la base de données de SQLite (`prisma/dev.db`) vers **Supabase PostgreSQL** (instance distante sur `db.mejeuwjrwxkyfhyfzgag.supabase.co`). Ajout simultané du **client JS Supabase** (real-time, lectures directes) tout en conservant Prisma pour les mutations via Server Actions (architecture hybride Prisma + Supabase JS).

---

## 1. Architecture cible

### Avant
```
SQLite (prisma/dev.db)
  └── Prisma Client ──→ Server Actions ──→ UI
```

### Après
```
Supabase PostgreSQL (distant)
  ├── Prisma Client ──→ Server Actions ──→ UI  (mutations)
  └── @supabase/supabase-js ──→ Real-time / lectures directes
```

- **Prisma** reste l'ORM principal pour toutes les mutations (create, update, delete) via les Server Actions
- **Supabase JS client** est disponible pour les fonctionnalités temps réel (real-time subscriptions) et les lectures côté client sans passer par le serveur
- **next-auth** avec CredentialsProvider + JWT reste inchangé — pas d'utilisation de Supabase Auth

---

## 2. Schéma Prisma (6.19.3 → PostgreSQL)

### Modèle de datasource

```
- provider = "sqlite"      →    provider = "postgresql"
- url = "file:./dev.db"    →    url = env("DATABASE_URL")  // Supabase PostgreSQL
```

### Modèles inchangés (5 modèles)

| Modèle | Type d'ID | Relations |
|---|---|---|
| `User` | `String @id @default(cuid())` | → Project, Task (assignee) |
| `Project` | `String @id @default(cuid())` | → User (owner), → Task |
| `Task` | `String @id @default(cuid())` | → Project, → User (assignee), → SubTask |
| `SubTask` | `String @id @default(cuid())` | → Task |
| `ActivityLog` | `String @id @default(cuid())` | — |

### Aucune adaptation nécessaire

Tous les types Prisma utilisés (`String`, `Boolean`, `DateTime`, `Int`) sont nativement compatibles PostgreSQL. Aucune annotation `@db.Text` ou autre spécifique au moteur n'était présente.

---

## 3. Configuration et variables d'environnement

### `.env` — Connexion Prisma → Supabase

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.mejeuwjrwxkyfhyfzgag.supabase.co:5432/postgres?sslmode=require"
```

- Port `5432` = direct (utilisé pour les migrations)
- Port `6543` = pooler (à utiliser en production)
- `sslmode=require` obligatoire pour Supabase

### `.env.local` — Client Supabase JS

```env
NEXT_PUBLIC_SUPABASE_URL=https://mejeuwjrwxkyfhyfzgag.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_aHdRzxy1SMm35AYDqsSoqA_J2DKAUGX
```

---

## 4. Packages installés

```
@supabase/supabase-js      # Client Supabase pour le navigateur
@supabase/ssr              # Helpers SSR pour Next.js (server components, middleware)
pg                         # Driver PostgreSQL pour Prisma
@types/pg                  # Types TypeScript pour pg
better-sqlite3             # Lecture SQLite pour le script de migration (devDependencies)
```

---

## 5. Fichiers créés

### `src/utils/supabase/server.ts`

Client Supabase pour Server Components. Utilise `createServerClient` de `@supabase/ssr` avec gestion des cookies via `next/headers`.

```typescript
export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => { ... },
    },
  });
};
```

### `src/utils/supabase/client.ts`

Client Supabase pour le navigateur. Utilise `createBrowserClient` de `@supabase/ssr`.

```typescript
export const createClient = () => createBrowserClient(supabaseUrl!, supabaseKey!);
```

### `src/utils/supabase/middleware.ts`

Middleware Supabase SSR pour rafraîchissement de session (compatible next-auth).

```typescript
export const createClient = (request: NextRequest) => { ... };
```

### `scripts/migrate-sqlite-to-supabase.mjs`

Script de migration des données SQLite vers Supabase. Fonctionnement :
1. Lit toutes les tables depuis `prisma/dev.db` via `better-sqlite3`
2. Convertit les types SQLite (timestamps → Date, 0/1 → Boolean)
3. Insère dans Supabase via Prisma avec `skipDuplicates: true`
4. Ordre : User → Project → Task → SubTask → ActivityLog (respect des FK)

---

## 6. Migration des données

### Compteurs

| Table | Enregistrements |
|---|---|
| User | 1 |
| Project | 3 |
| Task | 19 |
| SubTask | 9 |
| ActivityLog | 25 |

### Problèmes rencontrés lors de la migration

| Problème | Cause | Solution |
|---|---|---|
| `Invalid value provided. Expected DateTime, provided Int` | SQLite stocke les dates comme timestamps Unix (millisecondes), PostgreSQL attend des objets `Date` | Conversion `new Date(v)` dans le script |
| `Invalid value provided. Expected Boolean, provided Int` | SQLite stocke les booléens comme 0/1, PostgreSQL attend `true`/`false` | Conversion `Boolean(v)` dans le script |
| `Unique constraint failed on the fields: ('id')` | Exécution partielle antérieure ayant laissé des doublons | Ajout de `skipDuplicates: true` sur chaque `createMany` |

### Ordre d'insertion

```
1. User          (aucune FK entrante)
2. Project       (FK → User)
3. Task          (FK → Project, FK → User)
4. SubTask       (FK → Task)
5. ActivityLog   (FK → User)
```

---

## 7. Commandes utiles

### Prisma

```sh
npx prisma generate        # Regénérer le client
npx prisma db push         # Pousser le schéma vers Supabase
npx prisma studio          # Interface d'administration
```

### Migration (re-jeu)

```sh
# 1. Remettre temporairement SQLite
#    Modifier .env : DATABASE_URL="file:./dev.db"
# 2. Générer le client SQLite
npx prisma generate
# 3. Exécuter le script
node scripts/migrate-sqlite-to-supabase.mjs
# 4. Restaurer PostgreSQL
#    Modifier .env : DATABASE_URL="postgresql://..."
# 5. Regénérer le client PostgreSQL
npx prisma generate
```

### Vérifications

```sh
npx tsc --noEmit           # TypeScript check
npm run lint               # ESLint
npm run dev                # Serveur de développement
```

---

## 8. Points d'attention

| Point | Détail |
|---|---|
| **Mot de passe avec caractères spéciaux** | Le `@` dans le mot de passe doit être encodé en `%40` dans l'URI de connexion |
| **Port 5432 vs 6543** | `5432` (direct) pour les migrations, `6543` (pooler) pour l'application en production |
| **SSL obligatoire** | `?sslmode=require` est requis par Supabase — déjà dans l'URI |
| **`@updatedAt` non utilisé** | Les modèles utilisent `@default(now())` au lieu de `@updatedAt`. Les champs `updatedAt` ne se mettent pas à jour automatiquement — comportement identique à l'ancien SQLite |
| **Base SQLite conservée** | `prisma/dev.db` toujours présente pour référence ou re-migration |
| **Supabase Auth non utilisé** | L'authentification reste gérée par next-auth CredentialsProvider. Le middleware Supabase SSR est présent mais non activé dans `proxy.ts` |
| **RLS (Row Level Security)** | Non utilisé — l'accès à la base est géré par Prisma côté serveur via l'URI de connexion directe |

---

## 9. Fichiers modifiés / créés

| Fichier | Statut |
|---|---|
| `prisma/schema.prisma` | Modifié (provider → postgresql) |
| `.env` | Modifié (DATABASE_URL) |
| `.env.local` | Créé |
| `src/utils/supabase/server.ts` | Créé |
| `src/utils/supabase/client.ts` | Créé |
| `src/utils/supabase/middleware.ts` | Créé |
| `scripts/migrate-sqlite-to-supabase.mjs` | Créé |
| `AGENTS.md` | Modifié (section Prisma + Supabase PostgreSQL) |
| `package.json` | Modifié (5 nouvelles dépendances) |
