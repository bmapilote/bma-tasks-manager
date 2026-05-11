"use client";

import { SubTaskForm } from "./subtask-form";
import { SubTaskItem } from "./subtask-item";
import type { SerializedSubTask } from "@/types";

type Props = {
  taskId: string;
  subtasks: SerializedSubTask[];
  isAssignee?: boolean;
};

export function SubTaskList({ taskId, subtasks, isAssignee = false }: Props) {
  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div
      className={`mt-3 rounded-md border p-2 ${
        allDone ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"
      }`}
    >
      {totalCount > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {completedCount}/{totalCount} sous-tâches terminées
            </span>
            {allDone && (
              <span className="font-medium text-green-600">Terminé</span>
            )}
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {isAssignee && <SubTaskForm taskId={taskId} />}

      {subtasks.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {subtasks.map((subTask) => (
            <SubTaskItem key={subTask.id} subTask={subTask} isAssignee={isAssignee} />
          ))}
        </div>
      )}
    </div>
  );
}
