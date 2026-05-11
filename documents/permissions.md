# Permissions et Authorisation — Rapport

## Résumé

Système d'autorisation à deux niveaux : **rôle global** (`ADMIN` / `USER`) et **appartenance** (propriétaire de projet, assigné de tâche). Les actions sont protégées à la fois côté serveur (Server Actions) et côté UI (affichage conditionnel).

---

## 1. Rôles

Définis dans `src/types/index.ts` et `prisma/schema.prisma` :

| Rôle | Description |
|---|---|
| `ADMIN` | Accès complet à toutes les données, tous les projets, toutes les tâches |
| `USER` | Accès limité à ses propres projets et aux tâches qui lui sont assignées |

Stocké dans `User.role` (Prisma), valeur par défaut : `USER`.

---

## 2. Matrice des permissions (RBAC)

Fichier : `src/lib/rbac.ts`

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
| `tasks:change_status` | ✅ | ~~✅~~ ❌ (corrigé) |
| `tasks:change_priority` | ✅ | ❌ |
| `dashboard:global` | ✅ | ❌ |
| `analytics:read` | ✅ | ❌ |
| `permissions:manage` | ✅ | ❌ |

**Note :** `tasks:change_status` a été retiré du rôle `USER` pour éviter qu'un utilisateur puisse déplacer des tâches qui ne lui appartiennent pas via le Kanban. Seul le **propriétaire du projet**, l'**admin** ou l'**assigné de la tâche** peuvent changer le statut.

---

## 3. Architecture de l'autorisation

```
                     ┌──────────────────────┐
                     │    Server Action      │
                     │  (tasks, projects,    │
                     │   subtasks, admin)    │
                     └──────────┬───────────┘
                                │
                     ┌──────────▼───────────┐
                     │    requireUser()      │
                     │  (authentification)   │
                     └──────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
     ┌────────▼──────┐  ┌──────▼───────┐  ┌──────▼───────┐
     │  isAdmin(role) │  │  owner check │  │  assignee    │
     │  (role ADMIN)  │  │  (proprio)   │  │  check       │
     └────────┬───────┘  └──────┬───────┘  └──────┬───────┘
              │                 │                  │
              ▼                 ▼                  ▼
         Accès total      Projet perso       Tâche assignée
```

---

## 4. Visibilité des données

### 4.1 Projets

| Situation | `(dashboard)/projects` | `(dashboard)/projects/[id]` |
|---|---|---|
| **Admin** | Tous les projets | Tous les projets |
| **Owner du projet** | Ses projets | Son projet |
| **Assigné à une tâche** | Projet visible dans la liste | Vue lecture seule + gestion de sa tâche |
| **Autre utilisateur** | ❌ | `notFound()` |

Fichiers :
- `src/app/(dashboard)/projects/page.tsx` — `where: OR: [ownerId, tasks.some.assigneeId]`
- `src/app/(dashboard)/projects/[id]/page.tsx` — `hasAssignedTask` ou `isOwner` ou `isAdmin`

### 4.2 Tâches (page `/tasks`)

| Situation | Visibilité |
|---|---|
| **Admin** | Toutes les tâches |
| **Owner de projet** | Tâches de ses projets |
| **Assigné** | Tâches qui lui sont assignées |

Fichier : `src/app/(dashboard)/tasks/page.tsx`

### 4.3 Dashboard

Mêmes règles que les projets — basé sur `ownerId` ou `tasks.some.assigneeId`.

Fichier : `src/lib/dashboard-data.ts` — `getProjects()`

---

## 5. Actions serveur — matrice détaillée

### 5.1 `src/actions/tasks.ts`

| Action | Admin | Owner du projet | Assigné de la tâche | Autre |
|---|---|---|---|---|
| `createTask` | ✅ | ✅ | ❌ | ❌ |
| `updateTask` | ✅ | ✅ | ✅ (sa tâche) | ❌ |
| `updateTaskStatus` (drag & drop) | ✅ | ✅ | ✅ (sa tâche) | ❌ |
| `reassignTask` | ✅ | ✅ | ❌ | ❌ |
| `deleteTask` | ✅ | ✅ | ❌ | ❌ |

#### Détail des vérifications

```typescript
// updateTask — ligne 85
const isOwner = task.project.ownerId === user.id;
const isAssignee = task.assigneeId === user.id;
if (!isOwner && !isAssignee && !isAdmin(user.role)) {
  return { error: "Accès refusé" };
}

// updateTaskStatus — ligne 168
const isOwner = task.project.ownerId === user.id;
const isAssignee = task.assigneeId === user.id;
if (!isOwner && !isAssignee && !isAdmin(user.role)) {
  return { error: "Accès refusé" };
}

// reassignTask — ligne 205
// Permission "tasks:assign" + owner/admin
if (!can(user.role, "tasks:assign")) { ... }   // ADMIN only
if (task.project.ownerId !== user.id && !isAdmin(user.role)) { ... }

// deleteTask — ligne 251
if (task.project.ownerId !== user.id && !isAdmin(user.role)) { ... }
```

### 5.2 `src/actions/subtasks.ts`

| Action | Admin | Owner du projet | Assigné de la tâche parente | Autre |
|---|---|---|---|---|
| `createSubTask` | ✅ | ✅ | ✅ (sa tâche) | ❌ |
| `updateSubTask` | ✅ | ✅ | ✅ (sa tâche) | ❌ |
| `toggleSubTask` | ✅ | ✅ | ✅ (sa tâche) | ❌ |
| `deleteSubTask` | ✅ | ✅ | ✅ (sa tâche) | ❌ |

#### Détail des vérifications

```typescript
// Toutes les actions subtasks — pattern commun
if (!task) return { error: "..." };
const canManage = task.project.ownerId === user.id
               || task.assigneeId === user.id
               || isAdmin(user.role);
if (!canManage) return { error: "..." };
```

### 5.3 `src/actions/projects.ts`

| Action | Admin | Owner du projet | Autre |
|---|---|---|---|
| `createProject` | ✅ | ✅ (toujours) | ✅ (toujours) |
| `updateProject` | ✅ | ✅ | ❌ |
| `deleteProject` | ✅ | ✅ | ❌ |

### 5.4 `src/actions/admin.ts`

Toutes les actions nécessitent `requireAdmin()` (`isAdmin(role)` obligatoire).

---

## 6. Protection UI

### 6.1 TaskCard (`src/components/tasks/task-card.tsx`)

| Élément | `canEdit` (owner/admin) | `!canEdit` |
|---|---|---|
| Drag & drop | ✅ | ✅ (serveur vérifie) |
| Bouton supprimer | ✅ affiché | ❌ masqué |
| Sélecteur d'assignation | ✅ cliquable avec popup | ❌ simple affichage du nom |
| Zone sous-tâches | ✅ complète | ✅ partielle (selon `isAssignee`) |

### 6.2 SubTaskList (`src/components/tasks/subtask-list.tsx`)

| Élément | `isAssignee` | `!isAssignee` |
|---|---|---|
| Barre de progression | ✅ | ✅ |
| Formulaire d'ajout | ✅ | ❌ masqué |
| Sous-tâches (affichage) | ✅ | ✅ |
| Toggle checkbox | ✅ cliquable | ❌ statique (lecture seule) |
| Bouton modifier | ✅ | ❌ masqué |
| Bouton supprimer | ✅ | ❌ masqué |

### 6.3 ProjectDetail (`src/app/(dashboard)/projects/[id]/page.tsx`)

| Élément | `canEdit` (owner/admin) | `!canEdit` |
|---|---|---|
| TaskForm (création) | ✅ | ❌ masqué |
| Bouton supprimer projet | ✅ | ❌ masqué |

---

## 7. Scénario : utilisateur assigné dans un projet en lecture seule

Quand un **admin** assigne une tâche à un utilisateur dans un projet dont il n'est pas propriétaire :

1. **Visibilité** : le projet apparaît dans la liste `(dashboard)/projects` et dans le dashboard
2. **Accès page projet** : l'utilisateur peut voir le détail du projet (nom, description, Kanban)
3. **Tâche assignée** : l'utilisateur peut :
   - Modifier le titre, la description, la priorité, l'échéance de SA tâche
   - Changer le statut (drag & drop) de SA tâche
   - Ajouter, modifier, supprimer, toggler les sous-tâches de SA tâche
4. **Restrictions** : l'utilisateur ne peut PAS :
   - Supprimer sa tâche
   - Réassigner sa tâche à quelqu'un d'autre
   - Créer de nouvelles tâches dans le projet
   - Modifier les autres tâches du projet
   - Déplacer les autres tâches du projet
   - Gérer les sous-tâches des autres tâches

---

## 8. Flux de décision

```
Utilisateur connecté (requireUser)
│
├── isAdmin(role) ?
│   └── ✅ Accès total à toutes les données
│
├── Propriétaire du projet (project.ownerId === user.id) ?
│   └── ✅ Accès complet sur ce projet
│
├── Assigné à la tâche (task.assigneeId === user.id) ?
│   ├── ✅ Vue lecture seule du projet
│   ├── ✅ Modification de la tâche (updateTask)
│   ├── ✅ Changement de statut (updateTaskStatus)
│   ├── ✅ Gestion des sous-tâches
│   └── ❌ Suppression / réassignation
│
└── Aucun des cas ci-dessus
    └── ❌ Erreur "Accès refusé" ou notFound()
```

---

## 9. Résumé des fichiers impliqués

| Fichier | Rôle |
|---|---|
| `src/lib/rbac.ts` | Définition des permissions, fonctions `can()`, `isAdmin()` |
| `src/lib/require-user.ts` | Authentification, `requireUser()`, `requireAdmin()` |
| `src/actions/tasks.ts` | Vérifications par rôle/appartenance |
| `src/actions/subtasks.ts` | Vérifications par rôle/appartenance |
| `src/actions/projects.ts` | Vérifications par rôle/appartenance |
| `src/actions/admin.ts` | Protégé par `requireAdmin()` |
| `src/app/(dashboard)/projects/page.tsx` | Filtre projets par ownerId ou tasks.assigneeId |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Accès owner/admin/assigné, `canEdit` |
| `src/app/(dashboard)/tasks/page.tsx` | Filtre tâches par ownerId ou assigneeId |
| `src/lib/dashboard-data.ts` | Filtre projets par ownerId ou tasks.assigneeId |
| `src/components/tasks/task-card.tsx` | UI conditionnelle selon `canEdit` et `isAssignee` |
| `src/components/tasks/kanban-board.tsx` | Propagation de `currentUserId` et `canEdit` |
| `src/components/tasks/subtask-list.tsx` | UI conditionnelle selon `isAssignee` |
| `src/components/tasks/subtask-item.tsx` | UI conditionnelle selon `isAssignee` |
| `src/types/index.ts` | Types `Role`, `SerializedTask`, `SerializedProject` |

---

## 10. Validation

```sh
npx tsc --noEmit   # 0 erreurs
```
