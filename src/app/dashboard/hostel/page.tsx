"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, statusColumn } from "@/components/ui/DataTable";
import { Building2, MessageSquare, Utensils, Users, DoorOpen, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HostelDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
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

  const { hostelRooms, messMenu, visitors, complaintStats, activeComplaints } = data;

  const isWarden = ["hostel_warden", "chief_warden", "hostel_supervisor"].includes(user.role);
  
  const roomOccupancy = [
    { name: 'Occupied', value: hostelRooms.reduce((acc: any, r: any) => acc + r.occupied, 0) },
    { name: 'Vacant', value: hostelRooms.reduce((acc: any, r: any) => acc + (r.capacity - r.occupied), 0) },
  ];
  
  const pieColors = theme === "dark" 
    ? ['#818cf8', '#334155'] 
    : ['#6366f1', '#e2e8f0'];

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Hostel Management
          </h1>
          <p className="text-muted-foreground mt-1">Overview of accommodation, mess, and visitor logs.</p>
        </div>
        {!isWarden && (
          <Link href="/dashboard/hostel/complaints" className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-xl font-medium hover:bg-destructive/90 transition-colors shadow-sm">
            <MessageSquare className="h-4 w-4" />
            File Complaint
          </Link>
        )}
      </div>

      {isWarden ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
          <StatCard title="Total Capacity" value="450" icon={Building2} color="primary" />
          <StatCard title="Occupancy Rate" value="92%" icon={Users} color="success" />
          <StatCard title="Active Complaints" value={complaintStats.pending + complaintStats.inProgress} subtitle={`${complaintStats.pending} pending`} icon={MessageSquare} color="destructive" />
          <StatCard title="Visitors Today" value={visitors.length} icon={DoorOpen} color="info" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 stagger-children">
          <StatCard title="My Room" value="A-204" subtitle="Block A" icon={DoorOpen} color="primary" />
          <StatCard title="Mess Bill" value="₹3,200" subtitle="Pending for March" icon={Utensils} color="warning" />
          <StatCard title="Open Complaints" value="1" subtitle="WiFi issue" icon={MessageSquare} color="destructive" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Occupancy Chart (Warden only) or Mess Menu (Student) */}
        {isWarden ? (
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle>Room Occupancy</CardTitle>
              </div>
              <CardDescription>Current filled vs vacant beds</CardDescription>
            </CardHeader>
            <div className="flex-1 p-5 pt-0 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomOccupancy}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roomOccupancy.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <CardTitle>Today's Mess Menu</CardTitle>
              </div>
              <CardDescription>Wednesday</CardDescription>
            </CardHeader>
            <div className="flex-1 p-5 pt-0 space-y-4">
              <div className="bg-muted/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Breakfast</p>
                <p className="font-medium text-sm">{messMenu[2].breakfast}</p>
              </div>
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20">
                <p className="text-xs text-primary uppercase tracking-wider mb-1">Lunch</p>
                <p className="font-medium text-sm">{messMenu[2].lunch}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Snacks</p>
                <p className="font-medium text-sm">{messMenu[2].snacks}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dinner</p>
                <p className="font-medium text-sm">{messMenu[2].dinner}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Room Directory / Visitors */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              {isWarden ? <DoorOpen className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
              <CardTitle>{isWarden ? "Room Overview" : "Recent Visitors"}</CardTitle>
            </div>
            {isWarden && (
              <Link href="/dashboard/hostel/complaints" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View Complaints &rarr;
              </Link>
            )}
          </CardHeader>
          <div className="p-1 px-5 pb-5 pt-0">
            {isWarden ? (
              <DataTable 
                columns={[
                  { key: "room", label: "Room", className: "font-medium" },
                  { key: "block", label: "Block" },
                  { key: "capacity", label: "Capacity/Occupied", render: (row: any) => `${row.occupied} / ${row.capacity}` },
                  statusColumn("status", "Status"),
                ]}
                data={hostelRooms.slice(0, 5)}
              />
            ) : (
              <DataTable 
                columns={[
                  { key: "name", label: "Visitor Name", className: "font-medium" },
                  { key: "relation", label: "Relation", className: "text-muted-foreground text-xs" },
                  { key: "checkIn", label: "Check-in" },
                  statusColumn("status", "Status"),
                ]}
                data={visitors}
              />
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
