import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectForm } from "@/components/projects/project-form";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Projets</h1>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length} projet{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <details className="group rounded-lg border border-gray-200 bg-white">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </summary>
        <div className="border-t border-gray-200 px-4 py-4">
          <ProjectForm />
        </div>
      </details>

      {projects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">Aucun projet pour le moment</p>
        </div>
      ) : (
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
        </div>
      )}
    </div>
  );
}
