import { prisma } from "./prisma";

type LogAction =
  | "task:created"
  | "task:updated"
  | "task:completed"
  | "task:deleted"
  | "subtask:added"
  | "project:created"
  | "project:deleted";

export async function logActivity(
  userId: string,
  action: LogAction,
  entityId: string | null,
  entityType: string,
  metadata?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityId,
      entityType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
