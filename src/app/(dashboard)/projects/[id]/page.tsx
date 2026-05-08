import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/task-form";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteProject } from "@/actions/projects";
import type { TaskStatus, TaskPriority, SerializedSubTask } from "@/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          subtasks: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!project || project.ownerId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color || "#3b82f6" }}
              />
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            </div>
            {project.description && (
              <p className="mt-0.5 text-sm text-gray-500">{project.description}</p>
            )}
          </div>
        </div>

        <form action={deleteProject.bind(null, id)}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </form>
      </div>

      <TaskForm projectId={id} />

      <KanbanBoard
        tasks={project.tasks.map((t) => ({
          ...t,
          status: t.status as TaskStatus,
          priority: t.priority as TaskPriority,
          dueDate: t.dueDate?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          subtasks: t.subtasks.map((st) => ({
            ...st,
            createdAt: st.createdAt.toISOString(),
            updatedAt: st.updatedAt.toISOString(),
          })) as SerializedSubTask[],
        }))}
        projectId={id}
      />
    </div>
  );
}
