# Dashboard — Compte rendu d'implémentation

## Résumé

Réécriture complète du tableau de bord pour offrir une vue globale, moderne et professionnelle de l'évolution des projets et des tâches. 7 sections interconnectées, dark mode, filtres temps réel, et 3 graphiques analytiques.

---

## 1. Architecture générale

### Arbre des composants

```
DashboardPage (Server Component, force-dynamic)
├── DashboardFilters          (Client — useSearchParams, URL-driven)
├── StatsGrid                 (Client — 8 StatCard)
├── ProjectProgress           (Client — grille de cartes projet)
├── Charts                    (Client — recharts: Pie, Bar, Line)
└── ActivityFeed              (Client — timeline d'actions)
```

### Nouveaux fichiers créés

| Fichier | Rôle |
|---|---|
| `src/lib/dashboard-data.ts` | Fonction de fetching agrégé + calculs de stats |
| `src/lib/activity-log.ts` | Helper pour logger les actions en DB |
| `src/components/dashboard/stat-card.tsx` | Carte statistique réutilisable (icône, valeur, tendance) |
| `src/components/dashboard/stats-grid.tsx` | Grille des 8 cartes statistiques |
| `src/components/dashboard/project-progress.tsx` | Cartes projet avec barre de progression, statut, priorité |
| `src/components/dashboard/activity-feed.tsx` | Timeline d'activité avec icônes contextuelles |
| `src/components/dashboard/charts.tsx` | 3 graphiques recharts (donut, barres, lignes) |
| `src/components/dashboard/dashboard-filters.tsx` | Filtres URL-driven (projet, statut, priorité, recherche) |
| `src/components/dashboard/skeleton-loader.tsx` | États de chargement squelettiques (stats, projets, activité) |
| `src/components/ui/dark-mode-toggle.tsx` | Toggle dark mode (localStorage + class on `<html>`) |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `prisma/schema.prisma` | + modèle `ActivityLog` |
| `src/app/globals.css` | + variables CSS dark mode + animation fade-in-up |
| `src/components/layout/header.tsx` | + `DarkModeToggle`, classes dark: |
| `src/components/layout/sidebar.tsx` | Classes `dark:` sur tous les éléments |
| `src/actions/projects.ts` | + `logActivity()` sur create/delete |
| `src/actions/tasks.ts` | + `logActivity()` sur create/update/delete/status→DONE |
| `src/actions/subtasks.ts` | + `logActivity()` sur create |
| `src/app/(dashboard)/dashboard/page.tsx` | Réécriture complète |

---

## 2. Global Statistics (StatsGrid)

8 cartes statistiques affichées en grille responsive (1 → 2 → 4 colonnes) :

| Carte | Donnée | Icône |
|---|---|---|
| Projets | `stats.totalProjects` | FolderKanban (violet) |
| Tâches totales | `stats.totalTasks` | ListTodo (bleu) |
| Terminées | `stats.completedTasks` | CheckCircle2 (vert) |
| En cours | `stats.inProgressTasks` | PlayCircle (ambre) |
| En retard | `stats.overdueTasks` | AlertTriangle (rouge) |
| Prioritaires | `stats.highPriorityTasks` | AlertCircle (orange) |
| Sous-tâches faites | `stats.completedSubtasks` | CheckSquare (teal) |
| Progression | `stats.overallProgress%` | TrendingUp (cyan) |

**Composant `StatCard`** : réutilisable, prend `label`, `value`, `icon`, `trend?`, `colorClass`. Support dark mode natif via `dark:`.

---

## 3. Project Progress Section (ProjectProgress)

Grille de cartes projet (1 → 2 → 3 colonnes) avec pour chaque projet :

- Nom + description (truncated)
- Badge statut : Terminé (vert), Actif (bleu), Vide (gris)
- Badge priorité : Urgent (rouge), Haute (orange), Moyenne (bleu), Basse (gris)
- Barre de progression avec ratio `X/Y tâches` et pourcentage
- Alerte rouge si des tâches sont en retard
- Lien cliquable vers `/projects/[id]`

Données calculées dans `getDashboardData()` :
- `progress = Math.round(completedTasks / totalTasks * 100)`
- `priority` déduite de la priorité max des tâches du projet
- `status` : DONE / ACTIVE / EMPTY

---

## 4. Recent Activity Feed (ActivityFeed)

Timeline verticale avec ligne chronologique et pastilles colorées.

### Actions trackées (modèle `ActivityLog`)

| Action | Icône | Couleur | Déclencheur |
|---|---|---|---|
| `task:created` | PlusCircle | Bleu | `createTask` |
| `task:completed` | CheckCircle2 | Vert | `updateTaskStatus` → DONE |
| `task:updated` | Edit3 | Ambre | `updateTask` |
| `task:deleted` | Trash2 | Rouge | `deleteTask` |
| `subtask:added` | ListPlus | Teal | `createSubTask` |
| `project:created` | FolderPlus | Violet | `createProject` |
| `project:deleted` | FolderKanban | Gris | `deleteProject` |

Chaque entrée affiche :
- Le libellé de l'action (traduit en français)
- Le titre de l'entité entre guillemets (extrait du `metadata` JSON)
- Le nom du projet parent si disponible
- Le temps relatif ("Il y a 5min", "Il y a 2h", etc.)

### Modèle Prisma `ActivityLog`

```prisma
model ActivityLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  entityId   String?
  entityType String
  metadata   String?    // JSON: { title, projectName, projectId }
  createdAt  DateTime @default(now())
}
```

### Helper `logActivity()`

Fichier : `src/lib/activity-log.ts`

```typescript
type LogAction = "task:created" | "task:updated" | "task:completed"
               | "task:deleted" | "subtask:added" | "project:created"
               | "project:deleted";

export async function logActivity(userId, action, entityId, entityType, metadata?)
```

Appelé depuis chaque Server Action après l'opération réussie.

---

## 5. Analytics & Charts (Charts)

3 graphiques utilisant **recharts** (installé comme dépendance) :

### Pie Chart — Statuts des tâches
- Donut chart avec `innerRadius={55}`, `outerRadius={85}`
- 3 segments : À faire (gris #9ca3af), En cours (bleu #3b82f6), Terminé (vert #22c55e)
- Légende colorée en dessous
- Tooltip personnalisé

### Bar Chart — Tâches par projet
- Barres verticales avec `radius={4}` arrondi
- Couleur par projet (utilise `project.color` ou palette par défaut)
- Axes X/Y avec ticks stylisés
- Noms de projet tronqués à 12 caractères

### Line Chart — Productivité (14 jours)
- Courbe `monotone` avec points
- Données : nombre de tâches passées à "DONE" par jour (basé sur `updatedAt`)
- 14 jours glissants
- Axe X formaté en français (ex: "9 mai")

### États vides
Chaque charte affiche "Aucune donnée disponible" si aucune donnée pertinente n'existe.

---

## 6. Filters & Search (DashboardFilters)

Filtres **URL-driven** utilisant `useSearchParams` + `useRouter` (pas de state local, pas de React Query) :

| Filtre | Type | Comportement |
|---|---|---|
| Recherche | Input texte | Filtre par titre de tâche ou nom de projet |
| Projet | Select dropdown | Limite aux tâches d'un projet spécifique |
| Statut | Select dropdown | TODO / IN_PROGRESS / DONE |
| Priorité | Select dropdown | URGENT / HIGH / MEDIUM / LOW |
| Réinitialiser | Bouton | Efface tous les filtres |

**Fonctionnement** : chaque changement déclenche `router.push()` avec les nouveaux search params → re-rendu du Server Component → nouvelle exécution de `getDashboardData()` avec les filtres → stats, graphiques et projets sont recalculés côté serveur.

---

## 7. UI / UX

### Design
- Cartes modernes avec `rounded-xl`, `shadow-sm`, `hover:shadow-md`
- Espacement propre (`gap-4`, `p-5`, `space-y-6`)
- Transitions fluides (`transition-all`, `duration-300`, `hover:border-blue-200`)
- Animation d'entrée `fade-in-up` (CSS keyframes) sur le conteneur principal
- Grilles responsives : `sm:grid-cols-2 lg:grid-cols-4` pour les stats, `md:grid-cols-2 xl:grid-cols-3` pour les projets

### Dark mode
- Variables CSS custom (`--background`, `--foreground`, `--card`, `--card-border`) dans `globals.css`
- Bascule via classe `.dark` sur `<html>`
- Toggle stocké dans `localStorage("theme")`
- Détection `prefers-color-scheme: dark` au premier chargement
- Tous les composants ont leurs variantes `dark:`
- Le `DarkModeToggle` est intégré dans le Header

### Skeleton loading
3 squelettes prêts à l'emploi dans `skeleton-loader.tsx` :
- `StatsSkeleton` : 8 cartes en grille
- `ProjectsSkeleton` : 3 cartes projet
- `ActivitySkeleton` : 5 lignes de timeline

### Animations
- `animate-pulse` pour les squelettes
- `animate-in` via CSS `@keyframes fade-in-up` (opacity 0→1, translateY 8px→0)
- `transition-colors` et `transition-shadow` sur les éléments interactifs
- `transition-all duration-500` sur les barres de progression

---

## 8. Flux de données

```
Server Actions (create/update/delete)
  ↓ logActivity()
  ↓ revalidatePath("/dashboard")
  ↓
DashboardPage (Server Component)
  ↓ getDashboardData(userId, filters)
  ↓ Promise.all([projects, tasks, logs])
  ↓ Calculs stats, projets, distribution, productivité
  ↓ Props → Client Components
  ↓
StatsGrid, ProjectProgress, ActivityFeed, Charts
  ↓ (read-only, pas de fetching additionnel)
  ↓
DashboardFilters (useSearchParams)
  ↓ router.push() → Server Component re-render
  ↓
Tout le cycle se répète
```

---

## 9. Points d'attention

| Point | Détail |
|---|---|
| Productivité Line Chart | Basé sur `Task.updatedAt` des tâches DONE. Pas de champ `completedAt` dédié. Données historiques absentes si la tâche a été créée déjà en DONE. |
| ActivityLog vide au démarrage | Le flux d'activité est vide jusqu'à la première action. Affichage d'un état vide ("Aucune activité récente"). |
| Pas de pagination | Les 3 graphiques et le feed utilisent `take: 30` max. Pas de pagination pour le MVP. |
| Pas d'optimistic UI | Les filtres URL-driven déclenchent un re-rendu serveur complet via `router.push()`. Pas d'optimistic update côté client. |
| Touch events | Les filtres et le dark mode toggle fonctionnent au clic et au touch. Pas de gestes avancés. |
