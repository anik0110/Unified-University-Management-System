import clsx from "clsx";
import { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline" | "secondary" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  destructive: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  outline: "border-border text-muted-foreground",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant: BadgeVariant =
    status === "Paid" || status === "Success" || status === "Resolved" || status === "Closed" || status === "Active" || status === "Confirmed" || status === "Checked Out"
      ? "success"
      : status === "Pending" || status === "Almost Full"
      ? "warning"
      : status === "Failed" || status === "Overdue" || status === "Urgent"
      ? "destructive"
      : status === "In Progress" || status === "Assigned" || status === "In Campus"
      ? "info"
      : status === "Full"
      ? "secondary"
      : "default";

  return <Badge variant={variant}>{status}</Badge>;
}
