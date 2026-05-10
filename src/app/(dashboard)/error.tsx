"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error.message, "digest:", error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">Erreur</h2>
        <p className="mt-2 text-sm text-gray-500">
          Impossible de charger le tableau de bord.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {error.digest && `Référence : ${error.digest}`}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Vérifiez les logs serveur Netlify pour le digest {error.digest} afin de voir l&apos;erreur réelle.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
