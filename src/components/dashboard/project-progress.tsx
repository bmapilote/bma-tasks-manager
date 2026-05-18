"use client";

import Link from "next/link";
import { FolderKanban, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SerializedDashboardProject } from "@/lib/dashboard-data";

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  HIGH: { label: "Haute", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  MEDIUM: { label: "Moyenne", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  LOW: { label: "Basse", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  DONE: { label: "Terminé", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  ACTIVE: { label: "Actif", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  EMPTY: { label: "Vide", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

type Props = {
  projects: SerializedDashboardProject[];
};

export function ProjectProgress({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
        <FolderKanban className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Aucun projet pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const priority = priorityConfig[project.priority] || priorityConfig.MEDIUM;
        const status = statusConfig[project.status] || statusConfig.ACTIVE;

        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-border-hover hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: project.color || "#3b82f6" }}
                >
                  <FolderKanban className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  status.color
                )}
              >
                {status.label}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  priority.color
                )}
              >
                {priority.label}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {project.completedTasks}/{project.totalTasks} tâches
                </span>
                <span>{project.progress}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {project.overdueTasks > 0 && (
              <div className="mt-3 flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 dark:bg-red-900/20">
                <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400" />
                <span className="text-[11px] font-medium text-red-600 dark:text-red-300">
                  {project.overdueTasks} tâche{project.overdueTasks > 1 ? "s" : ""} en retard
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
