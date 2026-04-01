import { ReactNode } from "react";
import clsx from "clsx";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "primary" | "success" | "warning" | "destructive" | "info" | "accent";
  className?: string;
}

const colorMap = {
  primary: { bg: "bg-primary/10", text: "text-primary", icon: "text-primary" },
  success: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", icon: "text-emerald-500" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: "text-amber-500" },
  destructive: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", icon: "text-red-500" },
  info: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", icon: "text-blue-500" },
  accent: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", icon: "text-violet-500" },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = "primary", className }: StatCardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={clsx("text-2xl font-bold", colorMap[color].text)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={clsx(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={clsx("rounded-xl p-2.5", colorMap[color].bg)}>
          <Icon className={clsx("h-5 w-5", colorMap[color].icon)} />
        </div>
      </div>
      {/* Decorative gradient */}
      <div className={clsx("absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10", colorMap[color].bg)} />
    </div>
  );
}
