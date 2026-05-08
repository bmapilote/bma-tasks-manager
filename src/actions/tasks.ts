"use server";

import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { TaskStatus, TaskPriority } from "@/types";
import { logActivity } from "@/lib/activity-log";

function getUserIdOrThrow(session: Session | null): string {
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export async function createTask(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as TaskPriority;
  const dueDate = formData.get("dueDate") as string;
  const assigneeId = formData.get("assigneeId") as string;

  if (!projectId || !title || title.trim().length === 0) {
    return { error: "Projet et titre requis" };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== userId) {
    return { error: "Projet introuvable ou accès refusé" };
  }

  const maxPosition = await prisma.task.aggregate({
    where: { projectId, status: "TODO" },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description || null,
      status: "TODO",
      priority: Object.values(TaskPriority).includes(priority) ? priority : "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      position: (maxPosition._max.position ?? -1) + 1,
      projectId,
      assigneeId: assigneeId || null,
    },
  });

  logger.info({ taskId: task.id, projectId }, "task:created");
  await logActivity(userId, "task:created", task.id, "task", {
    title: task.title,
    projectName: project.name,
    projectId,
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
}

export async function updateTask(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!task || task.project.ownerId !== userId) {
    return { error: "Tâche introuvable ou accès refusé" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as TaskStatus;
  const priority = formData.get("priority") as TaskPriority;
  const dueDate = formData.get("dueDate") as string;
  const assigneeId = formData.get("assigneeId") as string;

  await prisma.task.update({
    where: { id },
    data: {
      title: title || undefined,
      description: description !== undefined ? (description || null) : undefined,
      status: status && Object.values(TaskStatus).includes(status) ? status : undefined,
      priority: priority && Object.values(TaskPriority).includes(priority) ? priority : undefined,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      assigneeId: assigneeId !== undefined ? (assigneeId || null) : undefined,
      updatedAt: new Date(),
    },
  });

  logger.info({ taskId: id }, "task:updated");
  await logActivity(userId, "task:updated", id, "task", {
    title: task.title,
    projectName: task.project.name,
    projectId: task.projectId,
  });
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!task || task.project.ownerId !== userId) {
    return { error: "Tâche introuvable ou accès refusé" };
  }

  if (!Object.values(TaskStatus).includes(status)) {
    return { error: "Statut invalide" };
  }

  const maxPosition = await prisma.task.aggregate({
    where: { projectId: task.projectId, status },
    _max: { position: true },
  });

  await prisma.task.update({
    where: { id },
    data: {
      status,
      position: (maxPosition._max.position ?? -1) + 1,
      updatedAt: new Date(),
    },
  });

  if (status === "DONE") {
    await logActivity(userId, "task:completed", id, "task", {
      title: task.title,
      projectName: task.project.name,
      projectId: task.projectId,
    });
  }
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}

export async function deleteTask(id: string): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!task || task.project.ownerId !== userId) {
    logger.warn({ taskId: id }, "task:delete_unauthorized");
    return;
  }

  await prisma.task.delete({ where: { id } });

  logger.info({ taskId: id }, "task:deleted");
  await logActivity(userId, "task:deleted", id, "task", {
    title: task.title,
    projectName: task.project.name,
    projectId: task.projectId,
  });
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}
