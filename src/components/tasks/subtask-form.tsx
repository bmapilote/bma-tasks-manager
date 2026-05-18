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
        className="block w-full rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex shrink-0 items-center justify-center rounded-md bg-primary p-1 text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </button>
      {state?.error && (
        <span className="text-xs text-destructive">{state.error}</span>
      )}
    </form>
  );
}
