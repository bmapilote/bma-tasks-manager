"use client";

import { useState, useRef, useEffect } from "react";
import { toggleSubTask, deleteSubTask, updateSubTask } from "@/actions/subtasks";
import { Trash2, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SerializedSubTask } from "@/types";

type Props = {
  subTask: SerializedSubTask;
  isAssignee?: boolean;
};

export function SubTaskItem({ subTask, isAssignee = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subTask.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function handleToggle() {
    await toggleSubTask(subTask.id);
  }

  async function handleDelete() {
    await deleteSubTask(subTask.id);
  }

  async function handleSave() {
    if (title.trim().length === 0) return;
    if (title.trim() !== subTask.title) {
      const formData = new FormData();
      formData.set("title", title.trim());
      await updateSubTask(subTask.id, formData);
    }
    setEditing(false);
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleSave();
    } else if (e.key === "Escape") {
      setTitle(subTask.title);
      setEditing(false);
    }
  }

  return (
    <div className="group flex items-center gap-2 py-1">
      {isAssignee ? (
        <button
          onClick={handleToggle}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            subTask.completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-border bg-card hover:border-gray-400 dark:hover:border-gray-500"
          )}
        >
          {subTask.completed && <Check className="h-3 w-3" />}
        </button>
      ) : (
        <div
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            subTask.completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-border bg-card"
          )}
        >
          {subTask.completed && <Check className="h-3 w-3" />}
        </div>
      )}

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="block w-full rounded border border-primary px-1 py-0.5 bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <span
          className={cn(
            "flex-1 truncate text-xs",
            subTask.completed ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {subTask.title}
        </span>
      )}

      {!editing && isAssignee && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground"
            title="Modifier"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
