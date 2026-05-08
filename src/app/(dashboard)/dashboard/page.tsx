import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [projects, myTasks] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { project: { select: { name: true, id: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Bon retour, {session.user.name || session.user.email?.split("@")[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Voici un aperçu de votre activité
          </p>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Projets récents</h2>
          <Link
            href="/projects"
            className="text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            Voir tout
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={{
                id: p.id,
                name: p.name,
                description: p.description,
                color: p.color,
                ownerId: p.ownerId,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                taskCount: p._count.tasks,
              }}
            />
          ))}
          <Link
            href="/projects/new"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-5 text-sm text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-500"
          >
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Mes tâches en cours</h2>
          <Link
            href="/tasks"
            className="text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            Voir tout
          </Link>
        </div>
        {myTasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Aucune tâche en cours. Profitez-en ! 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {myTasks.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${task.projectId}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-blue-200"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {task.project.name}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    task.status === "TODO"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {task.status === "TODO" ? "À faire" : "En cours"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
