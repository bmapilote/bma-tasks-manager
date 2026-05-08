# Sous-tâches (SubTask) — Compte rendu d'implémentation

## Modèle de données

Le modèle `SubTask` est défini dans `prisma/schema.prisma` avec les champs suivants :

| Champ | Type | Contrainte | Défaut |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | auto-généré |
| `title` | `String` | requis | — |
| `completed` | `Boolean` | `@default(false)` | `false` |
| `taskId` | `String` | clé étrangère → `Task` | — |
| `task` | `Task` | `@relation(fields: [taskId], references: [id], onDelete: Cascade)` | — |
| `createdAt` | `DateTime` | `@default(now())` | maintenant |
| `updatedAt` | `DateTime` | `@default(now())` | maintenant |

Une sous-tâche appartient à une tâche parente (`Task`). La relation `onDelete: Cascade` supprime automatiquement toutes les sous-tâches lorsqu'une tâche est supprimée.

## Types TypeScript

Défini dans `src/types/index.ts` :

```typescript
export type SerializedSubTask = {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
};
```

Le type `SerializedTask` inclut un champ optionnel `subtasks?: SerializedSubTask[]` pour embarquer les sous-tâches dans la réponse.

## Architecture des composants

Quatre fichiers composent l'interface des sous-tâches :

```
src/components/tasks/
├── subtask-form.tsx      # Formulaire d'ajout
├── subtask-list.tsx      # Conteneur avec barre de progression
├── subtask-item.tsx      # Ligne individuelle (édition inline, toggle, suppression)
└── task-card.tsx         # Intègre SubTaskList (point d'entrée)
```

### subtask-form.tsx

- Utilise `useActionState` de React 19 (état de formulaire natif)
- Champ caché `taskId` pour lier la sous-tâche à la tâche parente
- Champ texte `title` requis
- Bouton de soumission avec indicateur de chargement (`Loader2` spinner)
- Affiche les erreurs de validation en rouge

### subtask-list.tsx

- Reçoit `taskId` et `subtasks: SerializedSubTask[]` en props
- Affiche un compteur `X/Y sous-tâches terminées`
- Barre de progression proportionnelle (verte quand toutes complétées)
- Bordure verte quand 100% des sous-tâches sont complétées (`allDone`)
- Contient `SubTaskForm` pour ajouter de nouvelles sous-tâches
- Itère sur les sous-tâches pour rendre chaque `SubTaskItem`

### subtask-item.tsx

- **Checkbox** : bouton carré avec coche verte (`Check` icon) quand `completed`
- **Titre** : affiché normalement ou barré (`line-through`, `text-gray-400`) quand complété
- **Édition inline** :
  - Bouton crayon (`Pencil`) au survol → transforme le texte en `<input>`
  - `useRef` + `useEffect` pour auto-focus et sélection du texte
  - Sauvegarde au blur, sur `Enter`
  - Annule au `Escape` (restitue le titre original)
- **Suppression** : bouton poubelle (`Trash2`) au survol, rouge au hover
- Les boutons d'action apparaissent en `opacity-0` et passent à `opacity-100` au survol du groupe

### task-card.tsx (intégration)

- Importe `SubTaskList` depuis `./subtask-list`
- Rend `SubTaskList` quand `task.subtasks` est présent
- **Important** : utilise `onMouseDown={(e) => e.stopPropagation()}` sur le conteneur pour éviter de déclencher le drag & drop natif de la carte Kanban lorsqu'on interagit avec les sous-tâches

## Server Actions

Fichier : `src/actions/subtasks.ts`

### createSubTask(formData: FormData)

1. Récupère la session via `getServerSession(authOptions)`
2. Vérifie l'appartenance du projet via `task → project.ownerId`
3. Crée la sous-tâche avec `prisma.subTask.create()`
4. Log `subtask:created` avec pino
5. Revalide le chemin `/projects/${projectId}`

### updateSubTask(id: string, formData: FormData)

1. Vérifie la session et l'autorisation (remonte jusqu'au projet)
2. Valide que le titre n'est pas vide
3. Met à jour le titre et `updatedAt`
4. Log `subtask:updated`
5. Revalide le chemin

### toggleSubTask(id: string)

1. Vérifie la session et l'autorisation
2. Inverse `completed` sur la sous-tâche
3. **Auto-complétion de la tâche parente** :
   - Charge toutes les sous-tâches de la tâche parente
   - Si toutes sont terminées (`every(s => s.completed)`), met à jour `Task.status` à `"DONE"`
4. Log `subtask:toggled`
5. Revalide le chemin

### deleteSubTask(id: string)

1. Vérifie la session et l'autorisation
2. Log `subtask:delete_unauthorized` warning si accès refusé (ne throw pas)
3. Supprime la sous-tâche
4. Log `subtask:deleted`
5. Revalide le chemin

## Sérialisation des données

Dans `src/app/(dashboard)/projects/[id]/page.tsx`, les sous-tâches sont chargées avec Prisma et sérialisées :

```typescript
subtasks: { orderBy: { createdAt: "asc" } }
```

Les dates sont converties en ISO strings et le type casté en `SerializedSubTask[]` :

```typescript
subtasks: t.subtasks.map((st) => ({
  ...st,
  createdAt: st.createdAt.toISOString(),
  updatedAt: st.updatedAt.toISOString(),
})) as SerializedSubTask[],
```

## Points d'attention

| Point | Description |
|---|---|
| Drag & drop | Le `onMouseDown.stopPropagation()` sur la zone des sous-tâches dans `TaskCard` est essentiel pour ne pas interférer avec le Kanban HTML5 natif |
| Auto-complétion | `toggleSubTask` modifie le statut de la tâche parente uniquement quand **toutes** les sous-tâches sont cochées. Pas de mécanisme inverse (dé-cocher une sous-tâche ne remet pas la tâche en cours) |
| Pas d'optimistic UI | Les actions sont des Server Actions pures, pas de mise à jour optimiste côté client. L'interface se rafraîchit via `revalidatePath` |
| Pas de pagination | Les sous-tâches sont chargées intégralement avec leur tâche parente |
| Pas de réordonnancement | Les sous-tâches sont ordonnées par `createdAt` ascendant, pas de drag & drop pour les réordonner |
