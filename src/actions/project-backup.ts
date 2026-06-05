"use server";

import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";
import { isAdmin } from "@/lib/rbac";
import type { Role } from "@/types";

type SubTaskData = {
  title: string;
  completed: boolean;
};

type TaskData = {
  title: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  subtasks: SubTaskData[];
};

type ProjectExport = {
  version: number;
  exportedAt: string;
  project: {
    name: string;
    description: string | null;
    color: string | null;
  };
  completedTasks: TaskData[];
  upcomingTasks: TaskData[];
};

function canAccessProject(projectOwnerId: string, userId: string, userRole: Role) {
  return projectOwnerId === userId || isAdmin(userRole);
}

export async function exportProject(projectId: string) {
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          subtasks: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!project || !canAccessProject(project.ownerId, user.id, user.role)) {
    return { error: "Projet introuvable ou accès refusé" };
  }

  const serializeTask = (t: typeof project.tasks[0]): TaskData => ({
    title: t.title,
    description: t.description,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() ?? null,
    estimatedHours: t.estimatedHours,
    subtasks: t.subtasks.map((s) => ({
      title: s.title,
      completed: s.completed,
    })),
  });

  const data: ProjectExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      description: project.description,
      color: project.color,
    },
    completedTasks: project.tasks
      .filter((t) => t.status === "DONE")
      .map(serializeTask),
    upcomingTasks: project.tasks
      .filter((t) => t.status !== "DONE")
      .map(serializeTask),
  };

  logger.info({ userId: user.id, projectId }, "project:exported");
  await logActivity(user.id, "backup:exported", projectId, "project", {
    completedCount: data.completedTasks.length,
    upcomingCount: data.upcomingTasks.length,
  });

  return { data: JSON.stringify(data, null, 2) };
}

export type ProjectImportState = { success?: string; error?: string } | null;

export async function importProjectTasks(
  _prevState: ProjectImportState,
  formData: FormData
) {
  try {
    const user = await requireUser();

    const projectId = formData.get("projectId") as string;
    const jsonContent = formData.get("jsonContent") as string;

    if (!projectId) {
      return { error: "Projet non spécifié" };
    }
    if (!jsonContent || jsonContent.trim().length === 0) {
      return { error: "Aucune donnée JSON fournie" };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !canAccessProject(project.ownerId, user.id, user.role)) {
      return { error: "Projet introuvable ou accès refusé" };
    }

    let data: ProjectExport;
    try {
      data = JSON.parse(jsonContent);
    } catch {
      return { error: "Fichier JSON invalide — vérifiez la syntaxe" };
    }

    if (!data.project || !Array.isArray(data.upcomingTasks)) {
      return { error: "Format de sauvegarde invalide — 'project' et 'upcomingTasks' requis" };
    }

    const maxPosition = await prisma.task.aggregate({
      where: { projectId },
      _max: { position: true },
    });
    let nextPosition = (maxPosition._max.position ?? -1) + 1;
    let createdCompleted = 0;
    let createdUpcoming = 0;

    const createdTask = async (t: TaskData, status: string) => {
      const task = await prisma.task.create({
        data: {
          title: t.title || "Sans titre",
          description: t.description,
          status,
          priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(t.priority)
            ? t.priority
            : "MEDIUM",
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          estimatedHours: t.estimatedHours ?? null,
          position: nextPosition++,
          projectId,
          completedAt: status === "DONE" ? new Date() : null,
        },
      });

      if (Array.isArray(t.subtasks)) {
        for (const s of t.subtasks) {
          await prisma.subTask.create({
            data: {
              title: s.title || "Sans titre",
              completed: s.completed ?? false,
              taskId: task.id,
            },
          });
        }
      }
    };

    if (Array.isArray(data.completedTasks)) {
      for (const t of data.completedTasks) {
        await createdTask(t, "DONE");
        createdCompleted++;
      }
    }

    for (const t of data.upcomingTasks) {
      await createdTask(t, "TODO");
      createdUpcoming++;
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/tasks");

    return {
      success: `${createdCompleted} terminée(s) + ${createdUpcoming} à venir — ${createdCompleted + createdUpcoming} au total`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Erreur serveur : ${msg}` };
  }
}
