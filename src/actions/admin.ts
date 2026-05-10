"use server";

import { requireAdmin } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";
import type { Role } from "@/types";

export async function getUsers() {
  const user = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          assignedTasks: true,
          projects: true,
        },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role,
    department: u.department,
    jobTitle: u.jobTitle,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    taskCount: u._count.assignedTasks,
    projectCount: u._count.projects,
  }));
}

export async function updateUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    return { error: "Vous ne pouvez pas modifier votre propre rôle" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "Utilisateur introuvable" };
  }

  const previousRole = target.role;

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  logger.info({ targetUserId: userId, previousRole, newRole: role }, "user:role_changed");
  await logActivity(admin.id, "user:role_changed", userId, "user", {
    targetEmail: target.email,
    from: previousRole,
    to: role,
  });

  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    return { error: "Vous ne pouvez pas désactiver votre propre compte" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "Utilisateur introuvable" };
  }

  const newStatus = !target.isActive;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: newStatus,
      updatedAt: new Date(),
    },
  });

  const action = newStatus ? "user:activated" : "user:deactivated";
  logger.info({ targetUserId: userId, newStatus }, action);
  await logActivity(admin.id, action, userId, "user", {
    targetEmail: target.email,
  });

  revalidatePath("/admin/users");
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; department?: string; jobTitle?: string }
) {
  const admin = await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name || null }),
      ...(data.department !== undefined && { department: data.department || null }),
      ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle || null }),
      updatedAt: new Date(),
    },
  });

  logger.info({ targetUserId: userId }, "user:updated");
  await logActivity(admin.id, "user:updated", userId, "user", {
    ...data,
  });

  revalidatePath("/admin/users");
}

export async function getUserDetail(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          assignedTasks: true,
          projects: true,
        },
      },
      assignedTasks: {
        include: {
          project: { select: { id: true, name: true, color: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
      projects: {
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) {
    return null;
  }

  const overdueTasks = user.assignedTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  );

  const completedTasks = user.assignedTasks.filter((t) => t.status === "DONE");
  const inProgressTasks = user.assignedTasks.filter((t) => t.status === "IN_PROGRESS");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    department: user.department,
    jobTitle: user.jobTitle,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    taskCount: user._count.assignedTasks,
    projectCount: user._count.projects,
    overdueTasks: overdueTasks.length,
    completedTasks: completedTasks.length,
    inProgressTasks: inProgressTasks.length,
    recentTasks: user.assignedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      projectName: t.project.name,
      projectColor: t.project.color,
      createdAt: t.createdAt.toISOString(),
    })),
    projects: user.projects.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      status: p.status,
    })),
  };
}
