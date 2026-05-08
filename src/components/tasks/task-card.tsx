"use client";

import { deleteTask } from "@/actions/tasks";
import { cn, formatDateRelative } from "@/lib/utils";
import { AlertCircle, Calendar, Trash2 } from "lucide-react";
import { SubTaskList } from "./subtask-list";
import type { SerializedTask } from "@/types";

const statusColors: Record<string, string> = {
  TODO: "border-t-gray-300",
  IN_PROGRESS: "border-t-blue-500",
  DONE: "border-t-green-500",
};

const priorityColors: Record<string, string> = {
  LOW: "text-gray-400",
  MEDIUM: "text-blue-500",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
};

type Props = {
  task: SerializedTask;
};

export function TaskCard({ task }: Props) {
  async function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("taskId", task.id);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group cursor-grab rounded-lg border border-gray-200 border-t-4 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        statusColors[task.status]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
        <div className="flex items-center gap-1">
          <AlertCircle className={cn("h-3.5 w-3.5", priorityColors[task.priority])} />
          <form action={deleteTask.bind(null, task.id)}>
            <button
              type="submit"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
            </button>
          </form>
        </div>
      </div>

      {task.description && (
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateRelative(task.dueDate)}
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center gap-1">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
              {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)}
            </div>
            {task.assignee.name || task.assignee.email.split("@")[0]}
          </span>
        )}
      </div>

      {task.subtasks && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          <SubTaskList taskId={task.id} subtasks={task.subtasks} />
        </div>
      )}
    </div>
  );
}
