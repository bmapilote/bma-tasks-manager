export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type SerializedSubTask = {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
};

export type SerializedTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  position: number;
  projectId: string;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  assignedById: string | null;
  assignedBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  subtasks?: SerializedSubTask[];
};

export type SerializedProject = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: string;
  progress: number;
  deadline: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
};

export type SerializedUser = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: Role;
  department: string | null;
  jobTitle: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserSession = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
};
