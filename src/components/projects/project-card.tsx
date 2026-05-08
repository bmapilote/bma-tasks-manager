import Link from "next/link";
import { FolderKanban } from "lucide-react";
import type { SerializedProject } from "@/types";
import { formatDate } from "@/lib/utils";

type Props = {
  project: SerializedProject;
};

export function ProjectCard({ project }: Props) {
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
          <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
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
