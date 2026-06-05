"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { deleteTask, reassignTask } from "@/actions/tasks";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { SubTaskList } from "./subtask-list";
import { X, Calendar, Clock, User, Trash2 } from "lucide-react";
import type { SerializedTask } from "@/types";

const statusLabels: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

const statusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const priorityLabels: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

const priorityBadge: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  MEDIUM: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

type UserOption = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  task: SerializedTask;
  users: UserOption[];
  currentUserId: string;
  canEdit: boolean;
  onClose: () => void;
};

export function TaskDetailModal({ task, users, currentUserId, canEdit, onClose }: Props) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const isAssignee = task.assigneeId === currentUserId;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const currentAssignee = task.assignee;
  const createdBy = task.assignedBy;

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    await reassignTask(task.id, value || null);
    router.refresh();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-12 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xl animate-in rounded-xl border border-border bg-card p-6 shadow-2xl slide-in-from-bottom-4">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", statusColors[task.status])}>
              {statusLabels[task.status]}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", priorityBadge[task.priority])}>
              {priorityLabels[task.priority]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-lg font-semibold text-foreground">{task.title}</h2>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          {task.dueDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">{formatDate(task.dueDate)}</span>
            </div>
          )}
          {task.estimatedHours != null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{task.estimatedHours}h estimées</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            {canEdit ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                  className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-accent"
                >
                  {currentAssignee ? (
                    <>
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                        {currentAssignee.name?.charAt(0) || currentAssignee.email.charAt(0)}
                      </div>
                      {currentAssignee.name || currentAssignee.email.split("@")[0]}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Non assignée</span>
                  )}
                </button>
                {showAssigneePicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAssigneePicker(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg">
                      <select
                        autoFocus
                        value={currentAssignee?.id || ""}
                        onChange={handleAssigneeChange}
                        className="w-full rounded-lg border-0 bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            ) : currentAssignee ? (
              <span>
                {currentAssignee.name || currentAssignee.email.split("@")[0]}
              </span>
            ) : (
              <span className="text-muted-foreground">Non assignée</span>
            )}
          </div>
          {createdBy && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">Créée par {createdBy.name || createdBy.email.split("@")[0]}</span>
            </div>
          )}
        </div>

        {task.description ? (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </h3>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {task.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </h3>
            <p className="text-sm italic text-muted-foreground/60">Aucune description</p>
          </div>
        )}

        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sous-tâches
          </h3>
          {task.subtasks && task.subtasks.length > 0 ? (
            <div onMouseDown={(e) => e.stopPropagation()}>
              <SubTaskList
                taskId={task.id}
                subtasks={task.subtasks}
                isAssignee={isAssignee}
              />
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">Aucune sous-tâche</p>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Créée le {formatDate(task.createdAt)}</span>
            <span>Modifiée le {formatDate(task.updatedAt)}</span>
          </div>
        </div>

        {canEdit && (
          <div className="mt-4 flex justify-end">
            <form action={deleteTask.bind(null, task.id)}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer la tâche
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
