"use server";

import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

function getUserIdOrThrow(session: Session | null): string {
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export async function createProject(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

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
      ownerId: userId,
    },
  });

  logger.info({ projectId: project.id }, "project:created");
  await logActivity(userId, "project:created", project.id, "project", {
    title: project.name,
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    return { error: "Projet introuvable ou accès refusé" };
  }

  await prisma.project.update({
    where: { id },
    data: {
      name: name.trim() || project.name,
      description: description !== undefined ? (description || null) : project.description,
      color: color !== undefined ? (color || null) : project.color,
      updatedAt: new Date(),
    },
  });

  logger.info({ projectId: id }, "project:updated");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function deleteProject(id: string): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = getUserIdOrThrow(session);

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    logger.warn({ projectId: id }, "project:delete_unauthorized");
    return;
  }

  await prisma.project.delete({ where: { id } });

  logger.info({ projectId: id }, "project:deleted");
  await logActivity(userId, "project:deleted", id, "project", {
    title: project.name,
  });
  revalidatePath("/projects");
  redirect("/projects");
}
