"use client";

import { StatusBadge } from "./Badge";
import clsx from "clsx";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, className }: DataTableProps<T>) {
  return (
    <div className={clsx("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => (
              <th key={col.key} className={clsx("px-4 py-3 text-left font-medium text-muted-foreground", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col.key} className={clsx("px-4 py-3", col.className)}>
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper for common status column
export function statusColumn<T extends Record<string, unknown>>(key: string = "status", label: string = "Status") {
  return {
    key,
    label,
    render: (row: T) => <StatusBadge status={String(row[key])} />,
  };
}
