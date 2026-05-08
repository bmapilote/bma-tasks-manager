"use client";

import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  AlertCircle,
  CheckSquare,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "./stat-card";
import type { DashboardStats } from "@/lib/dashboard-data";

type Props = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: Props) {
  const cards = [
    {
      label: "Projets",
      value: stats.totalProjects,
      icon: <FolderKanban className="h-5 w-5" />,
      colorClass: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      label: "Tâches totales",
      value: stats.totalTasks,
      icon: <ListTodo className="h-5 w-5" />,
      colorClass: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Terminées",
      value: stats.completedTasks,
      icon: <CheckCircle2 className="h-5 w-5" />,
      colorClass: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      label: "En cours",
      value: stats.inProgressTasks,
      icon: <PlayCircle className="h-5 w-5" />,
      colorClass: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "En retard",
      value: stats.overdueTasks,
      icon: <AlertTriangle className="h-5 w-5" />,
      colorClass: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      label: "Prioritaires",
      value: stats.highPriorityTasks,
      icon: <AlertCircle className="h-5 w-5" />,
      colorClass: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
      label: "Sous-tâches faites",
      value: stats.completedSubtasks,
      icon: <CheckSquare className="h-5 w-5" />,
      colorClass: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    },
    {
      label: "Progression",
      value: `${stats.overallProgress}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      colorClass: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
