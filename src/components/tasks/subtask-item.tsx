"use client";

import { useState, useRef, useEffect } from "react";
import { toggleSubTask, deleteSubTask, updateSubTask } from "@/actions/subtasks";
import { Trash2, Check, Pencil } from "lucide-react";
import type { SerializedSubTask } from "@/types";

type Props = {
  subTask: SerializedSubTask;
};

export function SubTaskItem({ subTask }: Props) {
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
      <button
        onClick={handleToggle}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          subTask.completed
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        {subTask.completed && <Check className="h-3 w-3" />}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="block w-full rounded border border-blue-300 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <span
          className={`flex-1 truncate text-xs ${
            subTask.completed ? "text-gray-400 line-through" : "text-gray-700"
          }`}
        >
          {subTask.title}
        </span>
      )}

      {!editing && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-gray-600"
            title="Modifier"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
