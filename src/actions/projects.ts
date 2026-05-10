"use server";

import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";
import { isAdmin } from "@/lib/rbac";

export async function createProject(formData: FormData) {
  const user = await requireUser();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Le nom du projet est requis" };
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description || null,
      color: color || null,
      ownerId: user.id,
    },
  });

  logger.info({ projectId: project.id }, "project:created");
  await logActivity(user.id, "project:created", project.id, "project", {
    title: project.name,
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const user = await requireUser();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;
  const status = formData.get("status") as string;
  const deadline = formData.get("deadline") as string;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || (project.ownerId !== user.id && !isAdmin(user.role))) {
    return { error: "Projet introuvable ou accès refusé" };
  }

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (name?.trim()) data.name = name.trim();
  if (description !== undefined) data.description = description || null;
  if (color !== undefined) data.color = color || null;
  if (status) data.status = status;
  if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;

  await prisma.project.update({
    where: { id },
    data,
  });

  logger.info({ projectId: id }, "project:updated");
  await logActivity(user.id, "project:updated", id, "project", {
    title: project.name,
  });
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function deleteProject(id: string): Promise<void> {
  const user = await requireUser();

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || (project.ownerId !== user.id && !isAdmin(user.role))) {
    logger.warn({ projectId: id }, "project:delete_unauthorized");
    return;
  }

  await prisma.project.delete({ where: { id } });

  logger.info({ projectId: id }, "project:deleted");
  await logActivity(user.id, "project:deleted", id, "project", {
    title: project.name,
  });
  revalidatePath("/projects");
  redirect("/projects");
}
