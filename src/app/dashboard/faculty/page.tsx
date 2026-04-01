"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { Users, BookOpen, Clock, Calendar, FileCheck2, TrendingUp, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faculty/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (!user || !["professor", "hod"].includes(user.role)) return null;

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { facultyProfile, courses, totalStudents, avgAttendance, attendanceMetrics, totalSessions } = data;

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Welcome, {user.name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {facultyProfile.designation} | {facultyProfile.department}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/faculty/attendance" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <ClipboardCheck className="h-4 w-4" />
            Mark Attendance
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
        <StatCard title="Total Students" value={String(totalStudents)} subtitle={`Across ${courses.length} course${courses.length !== 1 ? "s" : ""}`} icon={Users} color="primary" />
        <StatCard title="Courses Taught" value={String(courses.length)} subtitle="Current Semester" icon={BookOpen} color="info" />
        <StatCard title="Avg Attendance" value={`${avgAttendance}%`} subtitle="Class aggregate" icon={Clock} color={avgAttendance >= 75 ? "success" : "warning"} />
        <StatCard title="Total Sessions" value={String(totalSessions)} subtitle="Classes conducted" icon={FileCheck2} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile / Details */}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader className="text-center pb-0 border-b-0 space-y-4">
            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold border-4 border-background shadow-lg">
              {user.avatar || user.name?.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription className="text-primary font-medium">{facultyProfile.department}</CardDescription>
            </div>

            <div className="mt-6 flex gap-4 text-left border-t border-border pt-6 grid grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Publications</p>
                <p className="font-bold text-lg">{facultyProfile.publications}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Experience</p>
                <p className="font-bold text-lg">{facultyProfile.experience} Yrs</p>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Office</p>
                <p className="font-medium text-sm">{facultyProfile.officeLocation || "Not specified"}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Attendance Distribution Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Attendance Distribution</CardTitle>
            </div>
            <CardDescription>Overall attendance breakdown across all courses</CardDescription>
          </CardHeader>
          <div className="flex-1 p-5 pt-0 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
                <Pie
                  data={attendanceMetrics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceMetrics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">Current Teaching Load</h2>
      <Card>
        <div className="p-1 px-5 pb-5 pt-5">
          {courses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No courses assigned yet. Contact admin to assign courses.</p>
          ) : (
            <DataTable
              columns={[
                { key: "code", label: "Course Code", className: "font-mono font-medium text-xs" },
                { key: "name", label: "Course Name", className: "font-medium" },
                { key: "program", label: "Program" },
                { key: "credits", label: "Credits" },
                { key: "enrolledCount", label: "Students" },
                { key: "action", label: "Quick Actions", render: (row: any) => (
                  <Link href={`/dashboard/faculty/attendance`} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium hover:bg-primary/20 transition-colors">
                    Mark Attendance
                  </Link>
                )},
              ]}
              data={courses}
            />
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
