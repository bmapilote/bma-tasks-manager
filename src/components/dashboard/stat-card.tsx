import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isUp: boolean };
  colorClass?: string;
};

export function StatCard({ label, value, icon, trend, colorClass }: Props) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md",
        "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.isUp ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isUp ? "+" : "-"}
              {trend.value}%
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            colorClass || "bg-blue-50 text-blue-600"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
