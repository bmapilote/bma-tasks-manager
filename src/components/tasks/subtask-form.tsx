"use client";

import { useRef, useState } from "react";
import { createSubTask } from "@/actions/subtasks";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

type Props = {
  taskId: string;
  onChange?: () => void;
};

export function SubTaskForm({ taskId, onChange }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createSubTask(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    formRef.current?.reset();
    setPending(false);
    onChange?.();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
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
        disabled={pending}
        className="flex shrink-0 items-center justify-center rounded-md bg-primary p-1 text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </form>
  );
}
