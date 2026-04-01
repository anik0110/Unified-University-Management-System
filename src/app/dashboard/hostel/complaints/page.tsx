"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, statusColumn } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { MessageSquare, AlertCircle, CheckCircle2, FileVideo, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import clsx from "clsx";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hostel/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (!user || user.role === "accountant" || user.role === "fest_coordinator") return null;

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { activeComplaints, complaintStats } = data;

  const isWarden = ["hostel_warden", "chief_warden", "hostel_supervisor"].includes(user.role);
  const chartColor = theme === "dark" ? "#818cf8" : "#6366f1";
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

  const priorityColor = (priority: string) => {
    switch(priority) {
      case 'Urgent': return 'text-red-500 bg-red-500/10 font-bold';
      case 'High': return 'text-orange-500 bg-orange-500/10';
      case 'Medium': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-emerald-500 bg-emerald-500/10';
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Complaint Management
          </h1>
          <p className="text-muted-foreground mt-1">Lodge and track hostel maintenance requests.</p>
        </div>
        {!isWarden && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            {showForm ? "Cancel" : <><Plus className="h-4 w-4" /> New Complaint</>}
          </button>
        )}
      </div>

      {showForm && !isWarden && (
        <Card className="mb-8 animate-fade-in border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>File a New Complaint</CardTitle>
            <CardDescription>Upload photos for faster resolution.</CardDescription>
          </CardHeader>
          <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Category</label>
              <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
                <option>WiFi / Internet</option>
                <option>Plumbing / Water</option>
                <option>Electrical</option>
                <option>Furniture</option>
                <option>Cleaning</option>
                <option>Mess / Food</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Priority</label>
              <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent (Emergency only)</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-foreground">Description</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Describe the issue in detail..."
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileVideo className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, MP4 (MAX. 10MB)</p>
                  </div>
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button 
                onClick={() => setShowForm(false)}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </Card>
      )}

      {isWarden && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <StatCard title="Total Tickets" value={complaintStats.total} icon={MessageSquare} color="primary" />
          <StatCard title="Pending" value={complaintStats.pending} icon={AlertCircle} color="warning" />
          <StatCard title="In Progress" value={complaintStats.inProgress} icon={AlertCircle} color="info" />
          <StatCard title="Resolved" value={complaintStats.resolved} icon={CheckCircle2} color="success" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isWarden && (
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>Category Trends</CardTitle>
              <CardDescription>Complaints by issue type</CardDescription>
            </CardHeader>
            <div className="flex-1 p-5 pt-0 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintStats.categoryBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                  <XAxis type="number" stroke={gridColor} fontSize={12} />
                  <YAxis dataKey="category" type="category" stroke={gridColor} fontSize={12} width={60} />
                  <Tooltip 
                    cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9' }}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {complaintStats.categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={chartColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card className={isWarden ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>{isWarden ? "Active Tickets Board" : "My Complaints History"}</CardTitle>
            <CardDescription>Track resolution status</CardDescription>
          </CardHeader>
          <div className="p-1 px-5 pb-5">
            <DataTable 
              columns={[
                { key: "id", label: "Ticket ID", className: "font-mono text-xs w-20" },
                { key: "category", label: "Category" },
                { key: "title", label: "Title", className: "font-medium" },
                { key: "priority", label: "Priority", render: (row: any) => (
                  <span className={clsx("px-2 py-0.5 rounded-md text-xs", priorityColor(String(row.priority)))}>
                    {String(row.priority)}
                  </span>
                )},
                statusColumn("status", "Status"),
                { key: "assignedTo", label: "Assigned To", className: "text-muted-foreground", render: (row: any) => row.assignedTo || "Unassigned" },
              ]}
              data={isWarden ? activeComplaints : activeComplaints.slice(0, 2)}
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
