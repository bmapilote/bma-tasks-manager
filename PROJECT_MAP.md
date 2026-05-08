# BMA Task Manager — Project Map

## [TECH_STACK]

| Couche | Technologie | Version | Justification |
|---|---|---|---|
| Runtime | Node.js | >=20.9.0 (local 20.11.1) | Requis par Next 16 |
| Framework | Next.js (App Router) | 16.2.6 | SSR, RSC, Server Actions natifs |
| UI | React | 19.2.4 | Stable, dernier majeur |
| Langage | TypeScript | ^5 | Typage strict |
| Styling | Tailwind CSS | 4.x | Utility-first, zero runtime |
| ORM | Prisma | 6.19.3 | Typage auto, migrations, PostgreSQL (v7 incompatible avec Node 20.11) |
| Auth | next-auth | 4.24.14 | CredentialsProvider + JWT, pas de PrismaAdapter nécessaire |
| Forms natifs | useActionState (React 19) | natif | Server Actions sans lib externe |
| Dates | date-fns | ^4.1.0 | Tree-shakable, immuable |
| Client data | @tanstack/react-query | ^5.100.9 | Cache, refetch, mutations |
| Logs | pino | ^10.3.1 | Async, basse latence, JSON |
| Icons | lucide-react | latest | SVG icons, tree-shakable |
| Validation | Zod | ^4.4.3 | Disponible mais non utilisé dans les forms (Server Actions valident côté serveur) |

### Déviations du plan initial

| Prévu | Réel | Raison |
|---|---|---|
| Prisma 7.8.0 | Prisma 6.19.3 | Node 20.11 < 20.19 requis par Prisma 7 |
| shadcn/ui | Aucun | Composants Tailwind natifs suffisent, zéro dépendance |
| @paralleldrive/cuid2 | Prisma `@default(cuid())` | Fonction native Prisma, zéro dépendance supplémentaire |
| react-hook-form + @hookform/resolvers | `useActionState` natif | React 19 fournit nativement l'état de formulaire pour Server Actions |
| middleware.ts | proxy.ts | Next.js 16 renomme `middleware` → `proxy` |

---

## [ARCHITECTURE]

```
┌─────────────────────────────────────────────────────┐
│                     Next.js 16 App                   │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  RSC /   │  │  Server      │  │  Client       │ │
│  │  Server   │  │  Actions     │  │  Components   │ │
│  │  Components│  │  (mutations) │  │  (interactive)│ │
│  └──────────┘  └──────────────┘  └───────────────┘ │
│       │               │                  │          │
│  ┌────▼───────────────▼──────────────────▼──────┐  │
│  │          proxy.ts (next-auth withAuth)        │  │
│  │    (protège /dashboard, /projects/*, /tasks)  │  │
│  └──────────────────────┬───────────────────────┘  │
│                         │                          │
│  ┌──────────────────────▼───────────────────────┐  │
│  │            Server Actions (3 fichiers)        │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │  auth   │ │ projects │ │    tasks     │  │  │
│  │  │ actions │ │ actions  │ │   actions    │  │  │
│  │  └─────────┘ └──────────┘ └──────────────┘  │  │
│  └──────────────────────┬───────────────────────┘  │
│                         │                          │
│  ┌──────────────────────▼───────────────────────┐  │
│  │            Prisma ORM 6.19.3                  │  │
│  │            PostgreSQL                         │  │
│  │  ┌───────┐ ┌──────────┐ ┌──────────────────┐  │  │
│  │  │ Users │ │ Projects │ │ Tasks + Status   │  │  │
│  │  └───────┘ └──────────┘ └──────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Structure du projet (réelle)

```
bma-task-manager/
├── prisma/
│   └── schema.prisma
├── proxy.ts                    # next-auth withAuth (remplace middleware.ts)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (fonts Geist)
│   │   ├── page.tsx            # Redirect → /dashboard ou /login
│   │   ├── globals.css         # Tailwind v4 + theme
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # SessionProvider + QueryClientProvider + Sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       └── settings-form.tsx
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   ├── projects/
│   │   │   ├── project-card.tsx
│   │   │   └── project-form.tsx
│   │   ├── tasks/
│   │   │   ├── task-card.tsx
│   │   │   ├── task-form.tsx
│   │   │   └── kanban-board.tsx
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   └── utils.ts
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   └── tasks.ts
│   └── types/
│       ├── index.ts
│       └── next-auth.d.ts
├── .env / .env.example
└── PROJECT_MAP.md
```

---

## [SYSTEM_FLOW] — Parcours utilisateur

```
1. AUTH ─────────────► GET  /login ou /register   → Server Component
                          POST form (credentials)  → next-auth authorize callback
                          Session JWT créée
                          REDIRECT → /dashboard

2. DASHBOARD ────────► GET /dashboard (RSC avec getServerSession)
                          ├─ 5 projets récents (findMany ownerId, orderBy updatedAt)
                          └─ 10 tasks assignées (status = TODO | IN_PROGRESS)

3. PROJECTS ─────────► GET /projects              → liste + bouton nouveau
                       GET /projects/[id]          → KanbanBoard + TaskForm
                       POST createProject          → redirect /projects/[id]
                       POST deleteProject(id)      → redirect /projects

4. TASKS ────────────► GET /tasks?status=&priority= → liste filtrée (query params)
                       KanbanBoard /projects/[id]  → Drag & drop change status
                       POST createTask             → revalidatePath
                       POST deleteTask(id)         → revalidatePath
                       POST updateTaskStatus       → revalidatePath

5. SETTINGS ─────────► GET /settings               → profil (read-only MVP)
```

### Objets métier

```
User
├── id: String @default(cuid())
├── name: String?
├── email: String @unique
├── emailVerified: DateTime?
├── image: String?
├── hashedPassword: String?
├── createdAt: DateTime @default(now())
├── updatedAt: DateTime @updatedAt
└── relations: projects, assignedTasks

Project
├── id: String @default(cuid())
├── name: String
├── description: String?
├── color: String?
├── ownerId: String → User (onDelete: Cascade)
├── createdAt: DateTime @default(now())
├── updatedAt: DateTime @updatedAt
└── relations: tasks

Task
├── id: String @default(cuid())
├── title: String
├── description: String?
├── status: String @default("TODO")       # TODO | IN_PROGRESS | DONE
├── priority: String @default("MEDIUM")   # LOW | MEDIUM | HIGH | URGENT
├── dueDate: DateTime?
├── position: Int @default(0)
├── projectId: String → Project (onDelete: Cascade)
├── assigneeId: String? → User (onDelete: SetNull)
├── createdAt: DateTime @default(now())
├── updatedAt: DateTime @updatedAt
└── relations: project, assignee
```

---

## [STRATÉGIE LOGGING]

### Implémentation réelle

```typescript
// src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  ...(process.env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty" },
  }),
});
```

### Points de logging implantés

| Point | Niveau | Fichier |
|---|---|---|
| User registered | info | `actions/auth.ts:31` |
| Login failed | warn | `actions/auth.ts:44` (via client login-form.tsx) |
| Project created | info | `actions/projects.ts:32` |
| Project updated | info | `actions/projects.ts:53` |
| Project deleted | info | `actions/projects.ts:65` |
| Task created | info | `actions/tasks.ts:53` |
| Task updated | info | `actions/tasks.ts:86` |
| Task deleted | info | `actions/tasks.ts:122` |

---

## [ORPHELINS ET EN ATTENTE]

| Élément | Statut | Justification |
|---|---|---|
| Seed script `prisma/seed.ts` | PENDING | Requis pour dev, pas critique pour le build |
| `prisma db push` / migration | PENDING | DB PostgreSQL non disponible sur cette machine |
| Tests (Vitest + Playwright) | PENDING | À définir |
| Dark mode | PENDING | Shadcn/ui non utilisé, à faire en Tailwind natif |
| Drag & drop fluide (dnd-kit) | PENDING | Actuel : native HTML5 drag & drop, pas d'optimistic UI |
| Pagination projets/tasks | PENDING | < 50 items pour MVP, pas nécessaire |
| Modification profil (Settings) | PENDING | Read-only pour l'instant |
| Edit inline des tasks/projets | PENDING | Seulement create/delete, pas d'edit form |
| File attachments | OUT | Nécessite S3, hors scope MVP |
| Commentaires | OUT | Table séparée, real-time |
| Notifications | OUT | SSE/WebSockets, hors scope |
| Labels/Tags | OUT | Many-to-many, hors scope |
| Export CSV | OUT | Hors scope |
| @paralleldrive/cuid2 | OUT | Remplacé par `@default(cuid())` Prisma |
| shadcn/ui | OUT | Composants Tailwind natifs |
| react-hook-form | OUT | Remplacé par `useActionState` natif React 19 |

---

## Plan d'exécution — État d'avancement

| # | Étape | Statut | Vérification |
|---|---|---|---|
| 1 | Init projet + dépendances | ✅ DONE | `npx next build` → compile, toutes les routes registrées |
| 2 | Prisma schema + generate | ✅ DONE | `npx prisma generate` → client généré. `db push` en attente de PostgreSQL |
| 3 | Auth (next-auth + proxy.ts) | ✅ DONE | `proxy.ts` avec `withAuth`, CredentialsProvider, JWT. Pages login/register |
| 4 | Layout (Sidebar + Header) | ✅ DONE | Navigation responsive, mobile overlay, SessionProvider |
| 5 | Dashboard RSC | ✅ DONE | 5 projets récents + 10 tasks assignées, lien "Nouveau projet" |
| 6 | Projects CRUD | ✅ DONE | Server Actions create/delete, ProjectCard, ProjectForm, page liste + détail |
| 7 | Tasks CRUD + Kanban | ✅ DONE | Kanban 3 colonnes, drag & drop change status, TaskForm, TaskCard |
| 8 | Filtres /tasks | ✅ DONE | Query params `?status=&priority=`, filtres cliquables |
| 9 | Logger | ✅ DONE | pino + pino-pretty dans `lib/logger.ts`, utilisé dans les actions |
| 10 | PROJECT_MAP.md finalisé | ✅ DONE | Ce document |
