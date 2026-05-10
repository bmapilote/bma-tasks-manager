# Implémentation du Système d'Administration — Compte rendu

## Résumé

Ajout d'un système d'administration complet avec gestion des rôles (RBAC), assignation des tâches étendue, tableau de bord global et gestion des utilisateurs. Architecture scalable, sécurisée et maintenable, basée sur les rôles `ADMIN` et `USER`.

---

## 1. Rôles et Permissions (RBAC)

### Architecture

Fichier : `src/lib/rbac.ts`

Système typé avec 15 permissions réparties sur deux rôles :

| Permission | ADMIN | USER |
|---|---|---|
| `users:read` | ✅ | ❌ |
| `users:write` | ✅ | ❌ |
| `users:delete` | ✅ | ❌ |
| `projects:read_all` | ✅ | ❌ |
| `projects:write_all` | ✅ | ❌ |
| `projects:delete_all` | ✅ | ❌ |
| `tasks:read_all` | ✅ | ❌ |
| `tasks:write_all` | ✅ | ❌ |
| `tasks:delete_all` | ✅ | ❌ |
| `tasks:assign` | ✅ | ❌ |
| `tasks:change_status` | ✅ | ✅ |
| `tasks:change_priority` | ✅ | ❌ |
| `dashboard:global` | ✅ | ❌ |
| `analytics:read` | ✅ | ❌ |
| `permissions:manage` | ✅ | ❌ |

### Fonctions d'aide

```typescript
hasPermission(role, "tasks:assign")  // Vérifie une permission
can(role, "users:read")              // Alias
isAdmin(role)                        // role === "ADMIN"
```

---

## 2. Modifications Prisma

### Fichier : `prisma/schema.prisma`

#### Nouvel enum

```prisma
enum Role {
  ADMIN
  USER
}
```

#### User — Champs ajoutés

| Champ | Type | Défaut | Description |
|---|---|---|---|
| `role` | `Role` | `USER` | Niveau d'accès |
| `department` | `String?` | — | Service de l'utilisateur |
| `jobTitle` | `String?` | — | Fonction |
| `isActive` | `Boolean` | `true` | Compte actif/désactivé |
| `lastLoginAt` | `DateTime?` | — | Dernière connexion |

#### User — Nouvelles relations

```
createdTasks   Task[]   @relation("TaskCreator")   // Tâches créées/assignées par
activityLogs   ActivityLog[]
```

#### Project — Champs ajoutés

| Champ | Type | Défaut | Description |
|---|---|---|---|
| `status` | `String` | `"ACTIVE"` | ACTIVE, COMPLETED, ARCHIVED |
| `progress` | `Int` | `0` | Progression calculée (0-100) |
| `deadline` | `DateTime?` | — | Date limite du projet |

#### Task — Champs ajoutés

| Champ | Type | Défaut | Description |
|---|---|---|---|
| `completedAt` | `DateTime?` | — | Date de complétion |
| `estimatedHours` | `Float?` | — | Estimation en heures |
| `assignedById` | `String?` | — | FK vers User (assignedBy) |
| `assignedBy` | `User?` | — | Relation vers User (qui a assigné) |

#### ActivityLog — Relation ajoutée

```prisma
user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
```

#### Types d'actions ActivityLog étendus

```
task:created, task:updated, task:completed, task:deleted
task:assigned, task:reassigned, task:priority_changed
subtask:added
project:created, project:deleted, project:updated
user:created, user:updated, user:role_changed
user:deactivated, user:activated
admin:login
```

---

## 3. Fichiers créés

| Fichier | Description |
|---|---|
| `src/lib/rbac.ts` | Système RBAC avec permissions typées |
| `src/actions/admin.ts` | Actions serveur pour la gestion des utilisateurs |
| `src/app/api/auth/me/route.ts` | API endpoint pour récupérer le rôle de l'utilisateur connecté |
| `src/app/(dashboard)/admin/page.tsx` | Dashboard admin global |
| `src/app/(dashboard)/admin/users/page.tsx` | Page de gestion des utilisateurs |
| `src/app/(dashboard)/admin/users/users-table.tsx` | Tableau interactif (recherche, filtre, actions) |
| `src/components/ui/card.tsx` | Composant Card réutilisable |
| `scripts/seed-admin.mjs` | Script de création du compte admin (bcrypt + Supabase Admin API) |
| `src/actions/tasks.ts` | Nouvelle action `reassignTask(taskId, assigneeId)` pour réassignation rapide |

---

## 4. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `prisma/schema.prisma` | Nouveaux champs, enum Role, relations |
| `src/types/index.ts` | Nouveaux types : `Role`, `SerializedUser`, champs ajoutés |
| `src/lib/require-user.ts` | `requireUser()` retourne le rôle, nouveau `requireAdmin()` protège les routes |
| `src/lib/activity-log.ts` | Types d'actions étendus, nouvelle fonction `getRecentActivity()` |
| `src/lib/dashboard-data.ts` | `getDashboardData()` supporte le rôle admin, nouvelle fonction `getAdminDashboardData()` |
| `src/actions/tasks.ts` | Vérifications RBAC : admin peut tout voir/modifier/supprimer |
| `src/actions/projects.ts` | Vérifications RBAC : admin peut tout gérer |
| `src/actions/subtasks.ts` | Vérifications RBAC : admin peut tout gérer |
| `src/components/layout/sidebar.tsx` | Liens admin visibles selon le rôle (fetched via `/api/auth/me`) |
| `src/components/layout/header.tsx` | Badge "ADMIN" affiché pour les admins |
| `src/components/projects/project-card.tsx` | Affichage du statut et de la progression |
| `src/app/(dashboard)/dashboard/page.tsx` | Passage du rôle à `getDashboardData()` |
| `src/app/(dashboard)/projects/page.tsx` | Admin voit tous les projets |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Admin peut accéder à tous les projets ; fetch des utilisateurs pour l'assignation |
| `src/components/tasks/task-form.tsx` | Nouveau select "Assignée à" dans le formulaire de création |
| `src/components/tasks/task-card.tsx` | Sélecteur d'assigné inline sur chaque carte (popup avec liste des utilisateurs) |
| `src/components/tasks/kanban-board.tsx` | Passe la liste des utilisateurs aux cartes |
| `src/app/(dashboard)/tasks/page.tsx` | Admin voit toutes les tâches |
| `src/app/(dashboard)/settings/page.tsx` | Affichage du rôle, département |
| `package.json` | Scripts : `seed`, `db:push`, `db:generate` |
| `.env.local` | Ajout de `SUPABASE_SERVICE_ROLE_KEY` |
| `.env.example` | Ajout de `SUPABASE_SERVICE_ROLE_KEY` |

---

## 5. Pages d'administration

### `/admin` — Dashboard Global

Statistiques globales :
- Nombre total d'utilisateurs, admins, utilisateurs actifs
- Utilisateurs avec tâches assignées
- Taux de complétion global
- Stats identiques au dashboard utilisateur mais sur l'ensemble des données
- Graphiques (distribution des tâches, tâches par projet, productivité)
- Fil d'activité de tous les utilisateurs

### `/admin/users` — Gestion des Utilisateurs

Tableau interactif avec :
- Recherche (nom, email, département, fonction)
- Filtre par rôle (Admin/Utilisateur)
- Changement de rôle via select inline
- Activation/désactivation de compte
- Affichage des statistiques (tâches, projets, dernière connexion)

---

## 6. Assignation des Tâches

### Formulaire de création

Fichier : `src/components/tasks/task-form.tsx`

Un select **"Assignée à"** liste tous les utilisateurs actifs lors de la création d'une tâche. L'action `createTask` enregistre `assigneeId` (destinataire) et `assignedById` (auteur de l'assignation).

### Sélecteur inline sur le Kanban

Fichier : `src/components/tasks/task-card.tsx`

Chaque carte du Kanban affiche l'assigné actuel (ou "Assigner" si non assignée). Un clic ouvre un popup avec un select de tous les utilisateurs actifs.

**Fonctionnement :**
1. Clic sur le nom de l'assigné → popup avec select déroulant
2. Sélection d'un utilisateur → appel à `reassignTask(taskId, assigneeId)`
3. Transition React (`useTransition`) désactive le select pendant l'opération
4. Log d'activité : `task:assigned` (première assignation) ou `task:reassigned` (changement)
5. `router.refresh()` pour mettre à jour l'affichage

### Action `reassignTask`

Fichier : `src/actions/tasks.ts`

```typescript
reassignTask(taskId: string, assigneeId: string | null)
```

- Vérifie la permission `tasks:assign` (ADMIN uniquement)
- Met à jour `assigneeId` et `assignedById`
- Crée un log d'activité avec l'historique (`previousAssigneeId`)
- Revalide les chemins `/projects/[id]` et `/tasks`

### Sécurité

- Seuls les utilisateurs avec la permission `tasks:assign` peuvent assigner/réassigner
- Le formulaire de création utilise `can(user.role, "tasks:assign")` pour filtrer
- Les logs permettent de tracer qui a assigné quoi et quand

---

## 7. Sécurité

### Contrôle d'accès

- `requireAdmin()` au début de chaque route admin → redirection si rôle insuffisant
- `requireUser()` retourne `AuthenticatedUser` avec `role` et `isActive`
- Comptes désactivés → message d'erreur "Compte désactivé — contactez un administrateur"
- Admin ne peut pas se désactiver ou changer son propre rôle (protection)
- API `/api/auth/me` expose uniquement `id`, `name`, `email`, `role`

### Vérifications dans les actions

Chaque action serveur (tasks, projects, subtasks) vérifie :
1. Si l'utilisateur est admin → bypass la vérification de propriétaire
2. Si l'utilisateur est le propriétaire → accès normal
3. Sinon → erreur "Accès refusé"

---

## 8. Dépendances ajoutées

| Package | Version | Usage |
|---|---|---|
| `bcryptjs` | ^2.4.3 | Hachage du mot de passe admin dans le seed |
| `ws` | ^8.18.2 | Support WebSocket pour Supabase Admin API sous Node 20 |

---

## 9. Compte Admin par Défaut

**Script** : `scripts/seed-admin.mjs`

Création automatique du compte administrateur :
1. Hachage du mot de passe avec bcrypt (12 rounds)
2. Création de l'utilisateur dans Supabase Auth via Admin API (`email_confirm: true`)
3. Création/mise à jour du compte Prisma avec `role: "ADMIN"`

**Identifiants** :
- Email : `admin@example.com`
- Mot de passe : `ChangeMe123!`
- Rôle : `ADMIN`

**Commande** :
```sh
node --env-file .env.local scripts/seed-admin.mjs
```

Note : La variable `SUPABASE_SERVICE_ROLE_KEY` doit être définie dans `.env.local`. Elle se trouve dans Supabase Dashboard → Settings → API → `service_role` key.

---

## 10. Migration de la base de données

```sh
# Connexion directe (port 5432) pour la migration
DATABASE_URL="postgresql://...:5432/postgres?sslmode=require" npx prisma db push

# Puis revenir au pooler (port 6543) pour l'application
```

Tous les nouveaux champs ont des valeurs par défaut ou sont optionnels → migration sans perte de données.

---

## 11. Architecture du RBAC

```
┌─────────────────────────────────────────────────────┐
│                      Action                         │
│   (createTask, updateProject, toggleUserActive...)  │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌──────────────────┐     ┌──────────────────┐
│   requireUser()   │────▶│   isAdmin(role)   │
│  (authentification)│    │   can(role, perm) │
└──────────────────┘     └──────────────────┘
           │                      │
           ▼                      ▼
   ┌──────────────┐     ┌──────────────────┐
   │   Prisma DB   │     │   Permissions    │
   │  (role, isActive)│   │   (rbac.ts)      │
   └──────────────┘     └──────────────────┘
```

- L'authentification reste gérée par Supabase Auth
- Les rôles sont stockés dans la table `User` (Prisma)
- Les permissions sont définies statiquement dans `rbac.ts`
- Le système est scalable : ajouter un rôle = ajouter une entrée dans `rolePermissions`

---

## 12. Tests et Validation

- `npx tsc --noEmit` → 0 erreurs
- `npm run build` → compilé avec succès (Turbopack)
- `npx prisma db push` → base synchronisée
- `npm run seed` → compte admin créé avec succès
