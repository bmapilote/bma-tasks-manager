"use client";

import {
  CheckCircle2,
  PlusCircle,
  Edit3,
  Trash2,
  ListPlus,
  FolderPlus,
  FolderKanban,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SerializedActivity } from "@/lib/dashboard-data";

const actionConfig: Record<
  string,
  { label: string; icon: typeof Clock; color: string }
> = {
  "task:created": {
    label: "Tâche créée",
    icon: PlusCircle,
    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400",
  },
  "task:completed": {
    label: "Tâche terminée",
    icon: CheckCircle2,
    color: "text-green-500 bg-green-50 dark:bg-green-900/30 dark:text-green-400",
  },
  "task:updated": {
    label: "Tâche modifiée",
    icon: Edit3,
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400",
  },
  "task:deleted": {
    label: "Tâche supprimée",
    icon: Trash2,
    color: "text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400",
  },
  "subtask:added": {
    label: "Sous-tâche ajoutée",
    icon: ListPlus,
    color: "text-teal-500 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400",
  },
  "project:created": {
    label: "Projet créé",
    icon: FolderPlus,
    color: "text-violet-500 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400",
  },
  "project:deleted": {
    label: "Projet supprimé",
    icon: FolderKanban,
    color: "text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400",
  },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

type Props = {
  activities: SerializedActivity[];
};

export function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-10 text-center dark:border-gray-700">
        <Clock className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Aucune activité récente
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-px bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-0">
        {activities.map((activity, i) => {
          const config = actionConfig[activity.action] || {
            label: activity.action,
            icon: Clock,
            color: "text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400",
          };
          const Icon = config.icon;
          let meta: Record<string, string> = {};
          try {
            meta = activity.metadata ? JSON.parse(activity.metadata) : {};
          } catch {}

          return (
            <div key={activity.id} className="relative flex items-start gap-4 pb-4">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {config.label}
                  {meta.title && (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {" "}«{meta.title}»
                    </span>
                  )}
                  {meta.projectName && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {" "}dans {meta.projectName}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {timeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
