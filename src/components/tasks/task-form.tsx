"use client";

import { useActionState } from "react";
import { createTask } from "@/actions/tasks";
import { Loader2, Plus } from "lucide-react";

type UserOption = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  projectId: string;
  users: UserOption[];
};

export function TaskForm({ projectId, users }: Props) {
  const [state, formAction, isPending] = useActionState<{ error: string } | undefined, FormData>(
    async (_prev, formData) => createTask(formData),
    undefined
  );

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <input type="hidden" name="projectId" value={projectId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Titre de la tâche"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Description (optionnelle)"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          name="priority"
          defaultValue="MEDIUM"
          className="block rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="LOW">Basse</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="HIGH">Haute</option>
          <option value="URGENT">Urgente</option>
        </select>

        <input
          name="dueDate"
          type="date"
          className="block rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <select
          name="assigneeId"
          className="block min-w-[160px] rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Non assignée</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Ajouter la tâche
      </button>
    </form>
  );
}
