"use client";

import { useState } from "react";
import { updateTaskStatus } from "@/actions/tasks";
import { TaskCard } from "./task-card";
import type { TaskStatus, SerializedTask } from "@/types";
import { cn } from "@/lib/utils";

const columns: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "À faire" },
  { id: "IN_PROGRESS", label: "En cours" },
  { id: "DONE", label: "Terminé" },
];

type UserOption = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  tasks: SerializedTask[];
  projectId: string;
  users: UserOption[];
};

export function KanbanBoard({ tasks, projectId, users }: Props) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  function getTasksByStatus(status: TaskStatus) {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  async function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setDropTarget(null);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      await updateTaskStatus(taskId, status);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const columnTasks = getTasksByStatus(col.id);
        const isOver = dropTarget === col.id;

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDragEnter={() => setDropTarget(col.id)}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={cn(
              "rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors",
              isOver && "border-blue-400 bg-blue-50"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-2 min-h-[100px]">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} users={users} />
              ))}
              {columnTasks.length === 0 && (
                <p className="py-8 text-center text-xs text-gray-400">
                  Aucune tâche
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
