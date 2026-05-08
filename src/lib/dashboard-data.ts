import { prisma } from "./prisma";

export type DashboardFilters = {
  projectId?: string;
  status?: string;
  priority?: string;
  search?: string;
};

export type DashboardData = {
  stats: DashboardStats;
  projects: SerializedDashboardProject[];
  recentActivity: SerializedActivity[];
  taskDistribution: { name: string; value: number; color: string }[];
  tasksPerProject: { name: string; tasks: number; color: string }[];
  productivityData: { date: string; completed: number }[];
};

export type DashboardStats = {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  completedSubtasks: number;
  overallProgress: number;
};

export type SerializedDashboardProject = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  progress: number;
  dueDate: string | null;
  priority: string;
  status: string;
};

export type SerializedActivity = {
  id: string;
  action: string;
  entityId: string | null;
  entityType: string;
  metadata: string | null;
  createdAt: string;
};

export async function getDashboardData(
  userId: string,
  filters?: DashboardFilters
): Promise<DashboardData> {
  const projectWhere: Record<string, unknown> = { ownerId: userId };
  if (filters?.projectId) {
    projectWhere["id"] = filters.projectId;
  }

  const [projects, tasks, logs] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            subtasks: { select: { completed: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { project: { ownerId: userId } },
      include: {
        project: { select: { id: true, name: true, color: true } },
        subtasks: { select: { completed: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const now = new Date();

  const filteredTasks = filters
    ? tasks.filter((t) => {
        if (filters.status && t.status !== filters.status) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.projectId && t.project.id !== filters.projectId) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (
            !t.title.toLowerCase().includes(q) &&
            !t.project.name.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
    : tasks;

  const completedTasks = filteredTasks.filter((t) => t.status === "DONE");
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "IN_PROGRESS"
  );
  const overdueTasks = filteredTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
  );
  const highPriorityTasks = filteredTasks.filter((t) =>
    ["HIGH", "URGENT"].includes(t.priority)
  );
  const completedSubtasks = filteredTasks.reduce(
    (sum, t) => sum + t.subtasks.filter((s) => s.completed).length,
    0
  );
  const overallProgress =
    filteredTasks.length > 0
      ? Math.round((completedTasks.length / filteredTasks.length) * 100)
      : 0;

  const serializedProjects: SerializedDashboardProject[] = projects.map(
    (p) => {
      const pCompleted = p.tasks.filter((t) => t.status === "DONE").length;
      const pInProgress = p.tasks.filter(
        (t) => t.status === "IN_PROGRESS"
      ).length;
      const pOverdue = p.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
      ).length;
      const progress =
        p.tasks.length > 0
          ? Math.round((pCompleted / p.tasks.length) * 100)
          : 0;

      return {
        id: p.id,
        name: p.name,
        color: p.color,
        description: p.description,
        totalTasks: p.tasks.length,
        completedTasks: pCompleted,
        inProgressTasks: pInProgress,
        overdueTasks: pOverdue,
        progress,
        dueDate: null,
        priority: p.tasks.some((t) => t.priority === "URGENT")
          ? "URGENT"
          : p.tasks.some((t) => t.priority === "HIGH")
          ? "HIGH"
          : p.tasks.some((t) => t.priority === "MEDIUM")
          ? "MEDIUM"
          : "LOW",
        status:
          pCompleted === p.tasks.length && p.tasks.length > 0
            ? "DONE"
            : p.tasks.length === 0
            ? "EMPTY"
            : "ACTIVE",
      };
    }
  );

  const statusColors: Record<string, string> = {
    TODO: "#9ca3af",
    IN_PROGRESS: "#3b82f6",
    DONE: "#22c55e",
  };

  const todoCount = filteredTasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = inProgressTasks.length;
  const doneCount = completedTasks.length;

  const taskDistribution = [
    { name: "À faire", value: todoCount, color: statusColors.TODO },
    {
      name: "En cours",
      value: inProgressCount,
      color: statusColors.IN_PROGRESS,
    },
    { name: "Terminé", value: doneCount, color: statusColors.DONE },
  ];

  const projectColors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#06b6d4"];
  const tasksPerProject = projects.map((p, i) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    tasks: p._count.tasks,
    color: p.color || projectColors[i % projectColors.length],
  }));

  const days = 14;
  const productivityData: { date: string; completed: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const count = tasks.filter(
      (t) =>
        t.status === "DONE" &&
        new Date(t.updatedAt) >= dayStart &&
        new Date(t.updatedAt) < dayEnd
    ).length;
    productivityData.push({
      date: dayStart.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      }),
      completed: count,
    });
  }

  const serializedLogs: SerializedActivity[] = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityId: l.entityId,
    entityType: l.entityType,
    metadata: l.metadata,
    createdAt: l.createdAt.toISOString(),
  }));

  return {
    stats: {
      totalProjects: projects.length,
      totalTasks: filteredTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      highPriorityTasks: highPriorityTasks.length,
      completedSubtasks,
      overallProgress,
    },
    projects: serializedProjects,
    recentActivity: serializedLogs,
    taskDistribution,
    tasksPerProject,
    productivityData,
  };
}
