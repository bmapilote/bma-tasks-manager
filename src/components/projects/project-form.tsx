"use client";

import { useActionState } from "react";
import { createProject } from "@/actions/projects";
import { Loader2 } from "lucide-react";

export function ProjectForm() {
  const [state, formAction, isPending] = useActionState<{ error: string } | undefined, FormData>(
    async (_prev, formData) => createProject(formData),
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Nom du projet
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description (optionnelle)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-foreground">
          Couleur
        </label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue="#3b82f6"
          className="mt-1 h-9 w-full rounded-lg border border-input bg-card p-1"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Créer le projet
      </button>
    </form>
  );
}
