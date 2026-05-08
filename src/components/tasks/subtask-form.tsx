"use client";

import { useActionState } from "react";
import { createSubTask } from "@/actions/subtasks";
import { Loader2, Plus } from "lucide-react";

type Props = {
  taskId: string;
};

export function SubTaskForm({ taskId }: Props) {
  const [state, formAction, isPending] = useActionState<{ error: string } | undefined, FormData>(
    async (_prev, formData) => createSubTask(formData),
    undefined
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <input
        name="title"
        type="text"
        required
        placeholder="Ajouter une sous-tâche"
        className="block w-full rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex shrink-0 items-center justify-center rounded-md bg-blue-600 p-1 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </button>
      {state?.error && (
        <span className="text-xs text-red-500">{state.error}</span>
      )}
    </form>
  );
}
