import Link from "next/link";
import { FolderKanban } from "lucide-react";
import type { SerializedProject } from "@/types";
import { formatDate } from "@/lib/utils";

type Props = {
  project: SerializedProject;
};

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  ARCHIVED: "Archivé",
};

export function ProjectCard({ project }: Props) {
  const statusStyle = statusStyles[project.status] || statusStyles.ACTIVE;
  const statusLabel = statusLabels[project.status] || project.status;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-lg border border-gray-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: project.color || "#e5e7eb" }}
        >
          <FolderKanban className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
              {project.name}
            </h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {project.description}
            </p>
          )}
          {project.progress > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-gray-400">{project.progress}%</span>
              </div>
            </div>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            {project.taskCount !== undefined && (
              <span>{project.taskCount} tâches</span>
            )}
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
