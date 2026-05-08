import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { AlertCircle, Calendar, FolderKanban } from "lucide-react";
import { TaskStatus, TaskPriority } from "@/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string; priority?: string }>;
};

const statusLabels: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

const priorityLabels: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export default async function TasksPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { status, priority } = await searchParams;

  const where: Record<string, unknown> = { project: { ownerId: session.user.id } };
  if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
    where.status = status;
  }
  if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
    where.priority = priority;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { position: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tâches</h1>
        <p className="mt-1 text-sm text-gray-500">
          {tasks.length} tâche{tasks.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", ...Object.values(TaskStatus)].map((s) => {
          const isActive = s === "all" ? !status : status === s;
          return (
            <Link
              key={s}
              href={s === "all" ? "/tasks" : `/tasks?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "Toutes" : statusLabels[s]}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={status ? `/tasks?status=${status}` : "/tasks"}
          className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
            !priority
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Toutes priorités
        </Link>
        {Object.entries(TaskPriority).map(([key, val]) => {
          const isActive = priority === val;
          return (
            <Link
              key={key}
              href={
                isActive
                  ? status
                    ? `/tasks?status=${status}`
                    : "/tasks"
                  : `/tasks?${status ? `status=${status}&` : ""}priority=${val}`
              }
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {priorityLabels[val]}
            </Link>
          );
        })}
      </div>

      {tasks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">Aucune tâche trouvée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.projectId}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-blue-200"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      task.priority === "URGENT"
                        ? "bg-red-500"
                        : task.priority === "HIGH"
                          ? "bg-orange-500"
                          : task.priority === "MEDIUM"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" />
                      {task.project.name}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  task.status === "TODO"
                    ? "bg-gray-100 text-gray-600"
                    : task.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {statusLabels[task.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
