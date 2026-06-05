"use client";

import { useActionState, useState } from "react";
import { exportProject, importProjectTasks } from "@/actions/project-backup";
import type { ProjectImportState } from "@/actions/project-backup";
import { Download, Upload, Loader2 } from "lucide-react";

type Props = {
  projectId: string;
};

export function ProjectBackup({ projectId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importState, formAction, isImporting] = useActionState<
    ProjectImportState,
    FormData
  >(importProjectTasks, null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportProject(projectId);
      if (result.error) return;
      if (result.data) {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `projet-${projectId.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Download className="h-4 w-4" />
        Exporter / Importer
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-80 space-y-3 rounded-lg border border-border bg-card p-4 shadow-lg">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter le projet
          </button>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="projectId" value={projectId} />
            <label className="block text-sm font-medium text-foreground">
              Restaurer des tâches
            </label>
            <input
              type="file"
              name="file"
              accept=".json"
              required
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground file:hover:opacity-90"
            />
            <button
              type="submit"
              disabled={isImporting}
              className="flex w-full items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Importer
            </button>
            {importState?.error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
                {importState.error}
              </div>
            )}
            {importState?.success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-300">
                {importState.success}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
