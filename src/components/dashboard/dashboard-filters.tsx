"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

type Props = {
  projects: { id: string; name: string }[];
};

export function DashboardFilters({ projects }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentProject = searchParams.get("projectId") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";
  const currentSearch = searchParams.get("search") || "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters = currentProject || currentStatus || currentPriority || currentSearch;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une tâche ou un projet..."
            defaultValue={currentSearch}
            onChange={(e) => setParam("search", e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={currentProject}
            onChange={(e) => setParam("projectId", e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tous les projets</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={currentStatus}
            onChange={(e) => setParam("status", e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DONE">Terminé</option>
          </select>

          <select
            value={currentPriority}
            onChange={(e) => setParam("priority", e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Toutes priorités</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">Haute</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Basse</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
