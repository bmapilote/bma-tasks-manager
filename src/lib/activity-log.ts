import { prisma } from "./prisma";

export type LogAction =
  | "task:created"
  | "task:updated"
  | "task:completed"
  | "task:deleted"
  | "task:assigned"
  | "task:reassigned"
  | "task:priority_changed"
  | "subtask:added"
  | "project:created"
  | "project:deleted"
  | "project:updated"
  | "user:created"
  | "user:updated"
  | "user:role_changed"
  | "user:deactivated"
  | "user:activated"
  | "admin:login";

export async function logActivity(
  userId: string,
  action: LogAction,
  entityId: string | null,
  entityType: string,
  metadata?: Record<string, unknown>
) {
  return prisma.activityLog.create({
    data: {
      userId,
      action,
      entityId,
      entityType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

export async function getRecentActivity(userId?: string, limit = 50) {
  const where = userId ? { userId } : {};
  return prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
