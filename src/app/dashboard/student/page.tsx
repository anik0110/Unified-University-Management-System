"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { BookOpen, BarChart3, Wallet, Building2, User, Trophy, Bell, Download } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard data:", error);
        setLoading(false);
      });
  }, []);

  if (!user || user.role !== "student") return null;

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-full">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { studentProfile, attendanceData, feeDetails, notifications } = data;

  const currentAttendance = Math.round(
    (attendanceData.reduce((acc: any, curr: any) => acc + curr.attended, 0) / 
    attendanceData.reduce((acc: any, curr: any) => acc + curr.total, 0)) * 100
  );

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {studentProfile.name.split(" ")[0]}! 👋</h1>
          <p className="text-muted-foreground mt-1">Here is your academic overview for {studentProfile.semester}th Semester.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Download className="h-4 w-4" />
          Download ID Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
        <StatCard title="Current CGPA" value={studentProfile.cgpa} subtitle={`SGPA: ${studentProfile.sgpa}`} icon={Trophy} color="primary" trend={{ value: 0.07, label: "vs last sem" }} />
        <StatCard title="Overall Attendance" value={`${currentAttendance}%`} subtitle="Target > 75%" icon={BarChart3} color={currentAttendance < 75 ? "destructive" : "success"} />
        <StatCard title="Pending Fees" value={`₹${feeDetails.pending.toLocaleString()}`} subtitle={`Due: ${feeDetails.dueDate}`} icon={Wallet} color="warning" />
        <StatCard title="Hostel Room" value={studentProfile.hostelRoom} subtitle="Block A" icon={Building2} color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profile Summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row gap-4 items-center justify-between mb-0 border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary/20">
                {user.avatar}
              </div>
              <div>
                <CardTitle className="text-xl">{studentProfile.name}</CardTitle>
                <CardDescription>{studentProfile.program}</CardDescription>
              </div>
            </div>
            <StatusBadge status={studentProfile.status} />
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-5">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Enrollment No.</p>
              <p className="font-medium">{studentProfile.enrollmentNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Semester/Section</p>
              <p className="font-medium">Sem {studentProfile.semester} - {studentProfile.section}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Admission Year</p>
              <p className="font-medium">{studentProfile.admissionYear}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium truncate">{studentProfile.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <p className="font-medium">{studentProfile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Blood Group</p>
              <p className="font-medium text-red-500">{studentProfile.bloodGroup}</p>
            </div>
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent alerts & updates</CardDescription>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bell className="h-5 w-5" />
            </div>
          </CardHeader>
          <div className="p-5 pt-0 space-y-4">
            {notifications.slice(0, 4).map((notif: any) => (
              <div key={notif.id} className="flex gap-3 items-start relative group">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notif.read ? 'bg-muted-foreground' : 'bg-primary animate-pulse'}`} />
                <div>
                  <p className={`text-sm ${notif.read ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5 pt-2">
            <Link href="/dashboard/student" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View All Notifications &rarr;
            </Link>
          </div>
        </Card>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Academics", icon: BookOpen, href: "/dashboard/student/academics", color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Attendance", icon: BarChart3, href: "/dashboard/student/attendance", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Fee Dashboard", icon: Wallet, href: "/dashboard/student/fees", color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Hostel Mgmt", icon: Building2, href: "/dashboard/hostel", color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((link, i) => (
          <Link key={i} href={link.href}>
            <Card hover className="flex flex-col items-center justify-center p-6 text-center group cursor-pointer border-transparent shadow-sm">
              <div className={`h-12 w-12 rounded-2xl ${link.bg} ${link.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <link.icon className="h-6 w-6" />
              </div>
              <p className="font-semibold">{link.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
