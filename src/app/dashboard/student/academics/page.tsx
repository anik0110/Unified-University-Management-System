"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { Download, BookMarked, GraduationCap, Award, BookOpen } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";

export default function AcademicsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (!user || user.role !== "student") return null;

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { studentProfile, semesterGrades, courses } = data;

  const chartColor = theme === "dark" ? "#818cf8" : "#6366f1";
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

  const currentSemester = studentProfile.semester;

  const courseColumns = [
    { key: "code", label: "Code", className: "font-mono font-medium text-xs" },
    { key: "name", label: "Course Name", className: "font-medium" },
    { key: "credits", label: "Credits" },
    { key: "type", label: "Type", render: (row: any) => (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${row.type === 'Core' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
        {row.type}
      </span>
    )},
    { key: "faculty", label: "Faculty" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookMarked className="h-8 w-8 text-primary" />
            Academics
          </h1>
          <p className="text-muted-foreground mt-1">View your enrolled courses and grade history.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium transition-colors border border-border">
          <Download className="h-4 w-4" />
          Download Transcript
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Enrolled Courses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Semester Courses</CardTitle>
            <CardDescription>Semester 5 (Autumn 2024)</CardDescription>
          </CardHeader>
          <div className="p-1 px-5 pb-5">
            <DataTable 
              columns={[
                { key: "code", label: "Code", className: "font-mono font-medium text-xs" },
                { key: "name", label: "Course Name", className: "font-medium" },
                { key: "credits", label: "Credits" },
                { key: "type", label: "Type", render: (row: any) => (
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${row.type === 'Core' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {row.type}
                  </span>
                )},
                { key: "faculty", label: "Faculty" },
              ]}
              data={courses}
            />
          </div>
        </Card>

        {/* CGPA Trend Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Performance Trend</CardTitle>
            </div>
            <CardDescription>CGPA vs SGPA history</CardDescription>
          </CardHeader>
          <div className="flex-1 p-5 pt-0 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={semesterGrades} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="semester" stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={gridColor} domain={[7, 10]} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Line type="monotone" dataKey="cgpa" name="CGPA" stroke={chartColor} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="sgpa" name="SGPA" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Past Grades Summary */}
      <h2 className="text-lg font-semibold mb-4 mt-8">Past Semester Results</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {semesterGrades.map((sem: any, i: number) => (
          <Card key={i} hover className="text-center p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{sem.semester}</h4>
            <div className="flex items-end justify-center gap-2">
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent">
                {sem.sgpa.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground mb-1">SGPA</span>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
