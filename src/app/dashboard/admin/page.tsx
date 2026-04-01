"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Users, GraduationCap, Building2, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (!user || !["super_admin", "director", "dean"].includes(user.role)) return null;

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { enrollmentTrends, riskAnalytics, collectionStats, totalStudents, totalFaculty, totalCourses } = data;

  const chartColor = theme === "dark" ? "#818cf8" : "#6366f1";
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            University Analytics
          </h1>
          <p className="text-muted-foreground mt-1">High-level insights &amp; real-time metrics for decision makers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
        <StatCard title="Total Students" value={String(totalStudents || 0)} subtitle="Active enrollments" icon={GraduationCap} color="primary" />
        <StatCard title="Total Faculty" value={String(totalFaculty || 0)} subtitle={totalStudents && totalFaculty ? `Ratio: ${Math.round(totalStudents / totalFaculty)}:1` : "—"} icon={Users} color="info" />
        <StatCard title="Total Courses" value={String(totalCourses || 0)} subtitle="Active this semester" icon={TrendingUp} color="success" />
        <StatCard title="Fee Collection" value={collectionStats.totalCollected > 0 ? `₹${(collectionStats.totalCollected / 100000).toFixed(1)}L` : "₹0"} subtitle={collectionStats.totalExpected > 0 ? `${Math.round((collectionStats.totalCollected / collectionStats.totalExpected) * 100)}% collected` : "No data"} icon={Building2} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Enrollment Trend */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>5-Year Enrollment Trend</CardTitle>
            <CardDescription>New admissions per academic year</CardDescription>
          </CardHeader>
          <div className="flex-1 p-5 pt-0 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="year" stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="count" name="Admissions" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorEnroll)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Predictive Risk Analytics */}
        <Card className="flex flex-col border-red-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Predictive Risk Factors
                </CardTitle>
                <CardDescription>Department-wise student risk indicators</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="flex-1 p-5 pt-0 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="department" stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="lowAttendance" name="Low Attendance (<75%)" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} barSize={40} />
                <Bar dataKey="poorGrades" name="Academic Warning (SGPA<5)" stackId="a" fill="#ef4444" />
                <Bar dataKey="feeDefault" name="Fee Defaulters" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
