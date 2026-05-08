"use client";

import { useActionState } from "react";
import { createTask } from "@/actions/tasks";
import { Loader2, Plus } from "lucide-react";

type Props = {
  projectId: string;
};

export function TaskForm({ projectId }: Props) {
  const [state, formAction, isPending] = useActionState<{ error: string } | undefined, FormData>(
    async (_prev, formData) => createTask(formData),
    undefined
  );

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <input type="hidden" name="projectId" value={projectId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
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
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Description (optionnelle)"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <select
          name="priority"
          defaultValue="MEDIUM"
          className="block rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="LOW">Basse</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="HIGH">Haute</option>
          <option value="URGENT">Urgente</option>
        </select>

        <input
          name="dueDate"
          type="date"
          className="block rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
