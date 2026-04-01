"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { CalendarCheck, CalendarDays, AlertTriangle, Download, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatusBadge } from "@/components/ui/Badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTheme } from "next-themes";

export default function StudentAttendance() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { attendanceData, monthlyAttendance } = data;

  // Calculate generic overall stats from DB data
  const overallPercentage = Math.round(
    attendanceData.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / (attendanceData.length || 1)
  );
  const totalClassesAttended = attendanceData.reduce((acc: number, curr: any) => acc + curr.attended, 0);
  const totalClassesHeld = attendanceData.reduce((acc: number, curr: any) => acc + curr.total, 0);

  // Helper for conditional coloring in Recharts
  const getColor = (percent: number) => {
    if (percent >= 85) return "hsl(var(--emerald-500))";
    if (percent >= 75) return "hsl(var(--blue-500))";
    return "hsl(var(--destructive))";
  };

  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-8 w-8 text-primary" />
            Attendance Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Track your course-wise and monthly attendance records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard title="Overall Attendance" value={`${overallPercentage}%`} subtitle="Target > 75%" icon={BarChart3} color={overallPercentage < 75 ? "warning" : "success"} />
        <StatCard title="Classes Attended" value={totalClassesAttended} subtitle={`Out of ${totalClassesHeld} classes`} icon={CalendarCheck} color="info" />
        <StatCard 
          title="Deficit Subjects" 
          value={attendanceData.filter((d: any) => d.percentage < 75).length} 
          subtitle="Subjects below 75%"
          icon={BarChart3} 
          color="destructive" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Subject-wise Breakdown</CardTitle>
            <CardDescription>Percentage per enrolled course</CardDescription>
          </CardHeader>
          <div className="flex-1 p-5 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                <XAxis type="number" domain={[0, 100]} stroke={gridColor} fontSize={12} tickFormatter={(val) => `${val}%`} />
                <YAxis dataKey="code" type="category" stroke={gridColor} fontSize={12} width={50} />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Attendance']}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={24}>
                  {attendanceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage < 75 ? '#ef4444' : entry.percentage > 85 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Trend Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Overall attendance across months</CardDescription>
          </CardHeader>
          <div className="flex-1 p-5 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="code" stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  formatter={(value: any, name: any, props: any) => [`${value}%`, `Attendance`]}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {attendanceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
