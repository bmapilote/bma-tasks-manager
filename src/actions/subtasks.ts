"use server";

import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";
import { isAdmin } from "@/lib/rbac";

export async function createSubTask(formData: FormData) {
  const user = await requireUser();

  const taskId = formData.get("taskId") as string;
  const title = formData.get("title") as string;

  if (!taskId || !title || title.trim().length === 0) {
    return { error: "Titre requis" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task || (task.project.ownerId !== user.id && !isAdmin(user.role))) {
    return { error: "Tâche introuvable ou accès refusé" };
  }

  await prisma.subTask.create({
    data: {
      title: title.trim(),
      taskId,
    },
  });

  logger.info({ taskId }, "subtask:created");
  await logActivity(user.id, "subtask:added", taskId, "subtask", {
    title: title.trim(),
    projectId: task.projectId,
  });
  revalidatePath(`/projects/${task.projectId}`);
}

export async function updateSubTask(id: string, formData: FormData) {
  const user = await requireUser();

  const subTask = await prisma.subTask.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });
  if (!subTask || (subTask.task.project.ownerId !== user.id && !isAdmin(user.role))) {
    return { error: "Sous-tâche introuvable ou accès refusé" };
  }

  const title = formData.get("title") as string;
  if (!title || title.trim().length === 0) {
    return { error: "Titre requis" };
  }

  await prisma.subTask.update({
    where: { id },
    data: {
      title: title.trim(),
      updatedAt: new Date(),
    },
  });

  logger.info({ subTaskId: id }, "subtask:updated");
  revalidatePath(`/projects/${subTask.task.projectId}`);
}

export async function toggleSubTask(id: string) {
  const user = await requireUser();

  const subTask = await prisma.subTask.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });
  if (!subTask || (subTask.task.project.ownerId !== user.id && !isAdmin(user.role))) {
    return { error: "Sous-tâche introuvable ou accès refusé" };
  }

  await prisma.subTask.update({
    where: { id },
    data: {
      completed: !subTask.completed,
      updatedAt: new Date(),
    },
  });

  const allSubtasks = await prisma.subTask.findMany({
    where: { taskId: subTask.taskId },
  });
  if (allSubtasks.every((s) => s.completed)) {
    await prisma.task.update({
      where: { id: subTask.taskId },
      data: { status: "DONE", completedAt: new Date(), updatedAt: new Date() },
    });
  }

  logger.info({ subTaskId: id, completed: !subTask.completed }, "subtask:toggled");
  revalidatePath(`/projects/${subTask.task.projectId}`);
}

export async function deleteSubTask(id: string): Promise<void> {
  const user = await requireUser();

  const subTask = await prisma.subTask.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });
  if (!subTask || (subTask.task.project.ownerId !== user.id && !isAdmin(user.role))) {
    logger.warn({ subTaskId: id }, "subtask:delete_unauthorized");
    return;
  }

  await prisma.subTask.delete({ where: { id } });

  logger.info({ subTaskId: id }, "subtask:deleted");
  revalidatePath(`/projects/${subTask.task.projectId}`);
}
