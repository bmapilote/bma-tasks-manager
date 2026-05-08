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
  position: number;
  projectId: string;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  subtasks?: SerializedSubTask[];
};

export type SerializedProject = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
};

export type UserSession = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};
