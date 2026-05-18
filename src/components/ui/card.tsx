"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon: ReactNode;
  colorClass: string;
  subtitle?: string;
};

export function Card({ label, value, icon, colorClass, subtitle }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
