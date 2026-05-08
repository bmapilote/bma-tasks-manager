"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

function getUserIdOrThrow(session: Awaited<ReturnType<typeof getServerSession>>): string {
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export async function createSubTask(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const taskId = formData.get("taskId") as string;
  const title = formData.get("title") as string;

  if (!taskId || !title || title.trim().length === 0) {
    return { error: "Titre requis" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task || task.project.ownerId !== userId) {
    return { error: "Tâche introuvable ou accès refusé" };
  }

  await prisma.subTask.create({
    data: {
      title: title.trim(),
      taskId,
    },
  });

  logger.info({ taskId }, "subtask:created");
  revalidatePath(`/projects/${task.projectId}`);
}

export async function updateSubTask(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const subTask = await prisma.subTask.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });
  if (!subTask || subTask.task.project.ownerId !== userId) {
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
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const subTask = await prisma.subTask.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });
  if (!subTask || subTask.task.project.ownerId !== userId) {
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
      data: { status: "DONE", updatedAt: new Date() },
    });
  }

  logger.info({ subTaskId: id, completed: !subTask.completed }, "subtask:toggled");
  revalidatePath(`/projects/${subTask.task.projectId}`);
}

export async function deleteSubTask(id: string): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const subTask = await prisma.subTask.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });
  if (!subTask || subTask.task.project.ownerId !== userId) {
    logger.warn({ subTaskId: id }, "subtask:delete_unauthorized");
    return;
  }

  await prisma.subTask.delete({ where: { id } });

  logger.info({ subTaskId: id }, "subtask:deleted");
  revalidatePath(`/projects/${subTask.task.projectId}`);
}
