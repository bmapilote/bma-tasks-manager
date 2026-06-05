"use client";

import { useState, useRef } from "react";
import { exportBackup, importBackup } from "@/actions/backup";
import type { ImportState } from "@/actions/backup";
import { Download, Upload, Loader2 } from "lucide-react";

export function BackupRestore() {
  const [importState, setImportState] = useState<ImportState>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportBackup();
      if (result.data) {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bma-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setImportState({ error: "Aucun fichier sélectionné" });
      return;
    }
    if (!file.name.endsWith(".json")) {
      setImportState({ error: "Le fichier doit être au format JSON" });
      return;
    }

    setIsImporting(true);
    setImportState(null);

    try {
      const text = await file.text();
      const formData = new FormData();
      formData.append("jsonContent", text);

      const result = await importBackup(null, formData);
      setImportState(result);
    } catch (err) {
      setImportState({
        error: err instanceof Error ? err.message : "Erreur lors de l'importation",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Sauvegarde &amp; Restauration</h2>

      <div className="space-y-3">
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
          Exporter les données
        </button>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Restaurer une sauvegarde
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground file:hover:opacity-90"
          />
          <button
            onClick={handleImport}
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
        </div>
      </div>
    </div>
  );
}
