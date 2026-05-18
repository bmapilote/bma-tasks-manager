import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Calendar, FolderKanban } from "lucide-react";
import { TaskStatus, TaskPriority } from "@/types";
import { isAdmin } from "@/lib/rbac";

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
  const user = await requireUser();
  const { status, priority } = await searchParams;

  const where: Prisma.TaskWhereInput = {};
  if (!isAdmin(user.role)) {
    where.OR = [
      { project: { ownerId: user.id } },
      { assigneeId: user.id },
    ];
  }
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
        <h1 className="text-xl font-semibold text-foreground">Tâches</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {priorityLabels[val]}
            </Link>
          );
        })}
      </div>

      {tasks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Aucune tâche trouvée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.projectId}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-border-hover"
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
                            : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
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
                    ? "bg-secondary text-muted-foreground"
                    : task.status === "IN_PROGRESS"
                      ? "bg-primary/10 text-primary"
                      : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
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
