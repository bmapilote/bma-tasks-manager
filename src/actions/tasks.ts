"use server";

import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { TaskStatus, TaskPriority } from "@/types";
import { logActivity } from "@/lib/activity-log";
import { can, isAdmin } from "@/lib/rbac";

export async function createTask(formData: FormData) {
  const user = await requireUser();

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
  if (!project) {
    return { error: "Projet introuvable" };
  }
  if (project.ownerId !== user.id && !isAdmin(user.role)) {
    return { error: "Accès refusé" };
  }

  const maxPosition = await prisma.task.aggregate({
    where: { projectId, status: "TODO" },
    _max: { position: true },
  });

  const assignedTo = assigneeId || null;
  const hasAssignPermission = can(user.role, "tasks:assign");
  const finalAssignee = assignedTo && hasAssignPermission ? assignedTo : null;

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description || null,
      status: "TODO",
      priority: Object.values(TaskPriority).includes(priority) ? priority : "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      position: (maxPosition._max.position ?? -1) + 1,
      projectId,
      assigneeId: finalAssignee,
      assignedById: finalAssignee ? user.id : null,
    },
  });

  logger.info({ taskId: task.id, projectId }, "task:created");
  await logActivity(user.id, "task:created", task.id, "task", {
    title: task.title,
    projectName: project.name,
    projectId,
  });

  if (finalAssignee) {
    await logActivity(user.id, "task:assigned", task.id, "task", {
      title: task.title,
      assigneeId: finalAssignee,
      projectId,
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
}

export async function updateTask(id: string, formData: FormData) {
  const user = await requireUser();

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!task) {
    return { error: "Tâche introuvable" };
  }
  const isOwner = task.project.ownerId === user.id;
  const isAssignee = task.assigneeId === user.id;
  if (!isOwner && !isAssignee && !isAdmin(user.role)) {
    return { error: "Accès refusé" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as TaskStatus;
  const priority = formData.get("priority") as TaskPriority;
  const dueDate = formData.get("dueDate") as string;
  const assigneeId = formData.get("assigneeId") as string;

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description || null;
  if (status && Object.values(TaskStatus).includes(status)) updateData.status = status;
  if (priority && Object.values(TaskPriority).includes(priority)) updateData.priority = priority;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (assigneeId !== undefined) {
    const hasAssignPermission = can(user.role, "tasks:assign");
    if (hasAssignPermission) {
      updateData.assigneeId = assigneeId || null;
      if (assigneeId) {
        updateData.assignedById = user.id;
      }
    }
  }
  if (status === "DONE") {
    updateData.completedAt = new Date();
  } else if (task.status === "DONE") {
    updateData.completedAt = null;
  }

  const changedPriority = priority && priority !== task.priority;
  const changedAssignee = assigneeId !== undefined && assigneeId !== task.assigneeId;

  await prisma.task.update({
    where: { id },
    data: updateData,
  });

  logger.info({ taskId: id }, "task:updated");
  await logActivity(user.id, "task:updated", id, "task", {
    title: task.title,
    projectName: task.project.name,
    projectId: task.projectId,
  });

  if (changedPriority) {
    await logActivity(user.id, "task:priority_changed", id, "task", {
      title: task.title,
      from: task.priority,
      to: priority,
    });
  }

  if (changedAssignee && assigneeId) {
    const action = task.assigneeId ? "task:reassigned" : "task:assigned";
    await logActivity(user.id, action, id, "task", {
      title: task.title,
      assigneeId,
      previousAssigneeId: task.assigneeId,
    });
  }

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const user = await requireUser();

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!task) {
    return { error: "Tâche introuvable" };
  }
  const isOwner = task.project.ownerId === user.id;
  const isAssignee = task.assigneeId === user.id;
  if (!isOwner && !isAssignee && !isAdmin(user.role)) {
    return { error: "Accès refusé" };
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
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  if (status === "DONE") {
    await logActivity(user.id, "task:completed", id, "task", {
      title: task.title,
      projectName: task.project.name,
      projectId: task.projectId,
    });
  }
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}

export async function reassignTask(taskId: string, assigneeId: string | null) {
  const user = await requireUser();

  if (!can(user.role, "tasks:assign")) {
    return { error: "Vous n'avez pas la permission d'assigner des tâches" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true, assignee: true },
  });
  if (!task) {
    return { error: "Tâche introuvable" };
  }
  if (task.project.ownerId !== user.id && !isAdmin(user.role)) {
    return { error: "Accès refusé" };
  }

  const previousAssigneeId = task.assigneeId;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      assigneeId: assigneeId || null,
      assignedById: assigneeId ? user.id : null,
      updatedAt: new Date(),
    },
  });

  const action = previousAssigneeId ? "task:reassigned" : "task:assigned";
  await logActivity(user.id, action, taskId, "task", {
    title: task.title,
    assigneeId,
    previousAssigneeId,
    projectId: task.projectId,
  });

  logger.info({ taskId, assigneeId, previousAssigneeId }, action);
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}

export async function deleteTask(id: string): Promise<void> {
  const user = await requireUser();

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!task || (task.project.ownerId !== user.id && !isAdmin(user.role))) {
    logger.warn({ taskId: id }, "task:delete_unauthorized");
    return;
  }

  await prisma.task.delete({ where: { id } });

  logger.info({ taskId: id }, "task:deleted");
  await logActivity(user.id, "task:deleted", id, "task", {
    title: task.title,
    projectName: task.project.name,
    projectId: task.projectId,
  });
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
}
