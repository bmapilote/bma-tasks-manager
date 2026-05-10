"use client";

import { useState, useTransition } from "react";
import { deleteTask, reassignTask } from "@/actions/tasks";
import { cn, formatDateRelative } from "@/lib/utils";
import { AlertCircle, Calendar, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
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

type UserOption = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  task: SerializedTask;
  users: UserOption[];
};

export function TaskCard({ task, users }: Props) {
  const router = useRouter();
  const [assigning, startAssign] = useTransition();
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);

  async function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("taskId", task.id);
  }

  function handleAssigneeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    startAssign(async () => {
      await reassignTask(task.id, value || null);
      router.refresh();
    });
  }

  const currentAssignee = task.assignee;

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

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAssigneePicker(!showAssigneePicker)}
            className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-gray-100"
          >
            {currentAssignee ? (
              <>
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                  {currentAssignee.name?.charAt(0) || currentAssignee.email.charAt(0)}
                </div>
                {currentAssignee.name || currentAssignee.email.split("@")[0]}
              </>
            ) : (
              <>
                <User className="h-3 w-3" />
                <span className="text-gray-400">Assigner</span>
              </>
            )}
          </button>

          {showAssigneePicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAssigneePicker(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <select
                  autoFocus
                  value={currentAssignee?.id || ""}
                  onChange={handleAssigneeChange}
                  disabled={assigning}
                  className="w-full rounded-lg border-0 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Non assignée</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {task.subtasks && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          <SubTaskList taskId={task.id} subtasks={task.subtasks} />
        </div>
      )}
    </div>
  );
}
