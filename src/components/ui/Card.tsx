import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, hover = false, glass = false, padding = "md" }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-border",
        glass ? "glass" : "bg-card text-card-foreground",
        hover && "transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        padding === "none" && "p-0",
        padding === "sm" && "p-3",
        padding === "md" && "p-5",
        padding === "lg" && "p-7",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={clsx("text-lg font-semibold", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("text-sm text-muted-foreground", className)}>{children}</p>;
}
