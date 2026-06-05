"use server";

import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

type BackupSubTask = {
  title: string;
  completed: boolean;
};

type BackupTask = {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  position: number;
  subtasks: BackupSubTask[];
};

type BackupProject = {
  name: string;
  description: string | null;
  color: string | null;
  deadline: string | null;
  tasks: BackupTask[];
};

type BackupData = {
  version: number;
  exportedAt: string;
  projects: BackupProject[];
};

export async function exportBackup() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    include: {
      tasks: {
        orderBy: { position: "asc" },
        include: {
          subtasks: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => ({
      name: p.name,
      description: p.description,
      color: p.color,
      deadline: p.deadline?.toISOString() ?? null,
      tasks: p.tasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        estimatedHours: t.estimatedHours,
        position: t.position,
        subtasks: t.subtasks.map((s) => ({
          title: s.title,
          completed: s.completed,
        })),
      })),
    })),
  };

  logger.info({ userId: user.id, projectCount: projects.length }, "backup:exported");
  await logActivity(user.id, "backup:exported", null, "backup", {
    projectCount: projects.length,
  });

  return { data: JSON.stringify(backup, null, 2) };
}

export type ImportState = { success?: string; error?: string } | null;

export async function importBackup(_prevState: ImportState, formData: FormData) {
  try {
    const user = await requireUser();

    const jsonContent = formData.get("jsonContent") as string;
    if (!jsonContent || jsonContent.trim().length === 0) {
      return { error: "Aucune donnée JSON fournie" };
    }

    let backup: BackupData;
    try {
      backup = JSON.parse(jsonContent);
    } catch {
      return { error: "Fichier JSON invalide" };
    }

    if (!backup.version || !Array.isArray(backup.projects)) {
      return { error: "Format de sauvegarde invalide" };
    }

    let createdProjects = 0;
    let createdTasks = 0;
    let createdSubTasks = 0;

    for (const p of backup.projects) {
      const project = await prisma.project.create({
        data: {
          name: p.name,
          description: p.description,
          color: p.color,
          deadline: p.deadline ? new Date(p.deadline) : null,
          ownerId: user.id,
        },
      });
      createdProjects++;

      for (const t of p.tasks) {
        const task = await prisma.task.create({
          data: {
            title: t.title,
            description: t.description,
            status: t.status || "TODO",
            priority: t.priority || "MEDIUM",
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            estimatedHours: t.estimatedHours,
            position: t.position,
            projectId: project.id,
          },
        });
        createdTasks++;

        for (const s of t.subtasks) {
          await prisma.subTask.create({
            data: {
              title: s.title,
              completed: s.completed,
              taskId: task.id,
            },
          });
          createdSubTasks++;
        }
      }
    }

    revalidatePath("/projects");
    revalidatePath("/tasks");
    revalidatePath("/dashboard");

    return {
      success: `${createdProjects} projet(s), ${createdTasks} tâche(s), ${createdSubTasks} sous-tâche(s) restauré(s)`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Erreur serveur : ${msg}` };
  }
}
