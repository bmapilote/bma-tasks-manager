"use client";

import { useTheme } from "@/components/theme/theme-provider";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

type Props = {
  taskDistribution: { name: string; value: number; color: string }[];
  tasksPerProject: { name: string; tasks: number; color: string }[];
  productivityData: { date: string; completed: number }[];
};

export function Charts({ taskDistribution, tasksPerProject, productivityData }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const hasTasks = taskDistribution.some((d) => d.value > 0);
  const hasProjects = tasksPerProject.some((p) => p.tasks > 0);
  const hasProductivity = productivityData.some((d) => d.completed > 0);

  const tooltipStyle = {
    backgroundColor: isDark ? "#111318" : "#ffffff",
    border: `1px solid ${isDark ? "#232733" : "#e5e7eb"}`,
    borderRadius: "8px",
    fontSize: "13px",
    color: isDark ? "#f3f4f6" : "#111827",
  };

  const axisColor = isDark ? "#6b7280" : "#9ca3af";
  const gridColor = isDark ? "#232733" : "#e5e7eb";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <ChartCard title="Statuts des tâches" empty={!hasTasks}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={taskDistribution.filter((d) => d.value > 0)}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {taskDistribution
                .filter((d) => d.value > 0)
                .map ((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          {taskDistribution.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Tâches par projet" empty={!hasProjects}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={tasksPerProject}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
              {tasksPerProject.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Productivité (14 jours)"
        empty={!hasProductivity}
        className="lg:col-span-2 xl:col-span-1"
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={productivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} stroke={axisColor} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="completed"
              stroke={isDark ? "#60a5fa" : "#3b82f6"}
              strokeWidth={2}
              dot={{ r: 3, fill: isDark ? "#60a5fa" : "#3b82f6" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  empty,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {title}
      </h3>
      {empty ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          Aucune donnée disponible
        </div>
      ) : (
        children
      )}
    </div>
  );
}
