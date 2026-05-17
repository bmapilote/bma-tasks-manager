"use client";

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
  const hasTasks = taskDistribution.some((d) => d.value > 0);
  const hasProjects = tasksPerProject.some((p) => p.tasks > 0);
  const hasProductivity = productivityData.some((d) => d.completed > 0);

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
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6" }}
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
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}
    >
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        {title}
      </h3>
      {empty ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
          Aucune donnée disponible
        </div>
      ) : (
        children
      )}
    </div>
  );
}
