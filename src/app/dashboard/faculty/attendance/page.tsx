"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ClipboardCheck, Calendar, Check, X, Clock, Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export default function FacultyAttendancePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch courses assigned to this faculty
  useEffect(() => {
    fetch("/api/faculty/dashboard")
      .then(res => res.json())
      .then(data => {
        if (data.success) setCourses(data.data.courses || []);
        setLoading(false);
      });
  }, []);

  // Fetch students and attendance when course changes
  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    fetch(`/api/faculty/attendance?courseId=${selectedCourse}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStudents(data.students || []);
          setPastRecords(data.records || []);
          // Initialize all students as "Present"
          const initial: Record<string, string> = {};
          (data.students || []).forEach((s: any) => { initial[s._id] = "Present"; });

          // Check if attendance exists for selected date
          const existingRecord = (data.records || []).find((r: any) =>
            new Date(r.date).toISOString().split("T")[0] === date
          );
          if (existingRecord) {
            existingRecord.records.forEach((r: any) => {
              initial[r.studentId] = r.status;
            });
          }
          setAttendance(initial);
        }
        setLoading(false);
      });
  }, [selectedCourse, date]);

  if (!user || !["professor", "hod", "dean"].includes(user.role)) return null;

  const handleSubmit = async () => {
    if (!selectedCourse || students.length === 0) return;
    setSubmitting(true);
    setMessage("");
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId, status,
      }));
      const res = await fetch("/api/faculty/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse, date, records }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Attendance submitted successfully!");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = (studentId: string) => {
    setAttendance(prev => {
      const current = prev[studentId];
      const next = current === "Present" ? "Absent" : current === "Absent" ? "Late" : "Present";
      return { ...prev, [studentId]: next };
    });
  };

  const statusIcon = (status: string) => {
    if (status === "Present") return <Check className="h-4 w-4" />;
    if (status === "Absent") return <X className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const statusClass = (status: string) => {
    if (status === "Present") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status === "Absent") return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  const presentCount = Object.values(attendance).filter(s => s === "Present").length;
  const absentCount = Object.values(attendance).filter(s => s === "Absent").length;
  const lateCount = Object.values(attendance).filter(s => s === "Late").length;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Mark Attendance
        </h1>
        <p className="text-muted-foreground mt-1">Select a course and mark attendance for today&apos;s session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="p-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Select Course</label>
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">— Choose a course —</option>
            {courses.map((c: any) => (
              <option key={c._id} value={c._id}>{c.code} — {c.name} ({c.enrolledCount} students)</option>
            ))}
          </select>
        </Card>
        <Card className="p-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </Card>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>{message}</div>
      )}

      {selectedCourse && !loading && students.length > 0 && (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center border-emerald-500/20 bg-emerald-500/5">
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </Card>
            <Card className="p-4 text-center border-red-500/20 bg-red-500/5">
              <p className="text-2xl font-bold text-red-500">{absentCount}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </Card>
            <Card className="p-4 text-center border-amber-500/20 bg-amber-500/5">
              <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </Card>
          </div>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Students ({students.length})</CardTitle>
              <CardDescription>Click to toggle: Present → Absent → Late</CardDescription>
            </CardHeader>
            <div className="px-5 pb-5 space-y-2">
              {students.map((student: any, index: number) => (
                <button
                  key={student._id}
                  onClick={() => toggleStatus(student._id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${statusClass(attendance[student._id] || "Present")}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-8">{index + 1}.</span>
                    <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-xs font-bold">
                      {student.name?.charAt(0) || "?"}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs opacity-70">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(attendance[student._id] || "Present")}
                    <span className="text-xs font-medium">{attendance[student._id] || "Present"}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><ClipboardCheck className="h-4 w-4" /> Submit Attendance</>}
            </button>
          </div>
        </>
      )}

      {selectedCourse && !loading && students.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          No students enrolled in this course yet. Ask admin to enroll students.
        </Card>
      )}

      {loading && selectedCourse && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Past Attendance Records */}
      {selectedCourse && pastRecords.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Past Attendance Records</CardTitle>
            <CardDescription>Previous sessions for this course</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5 space-y-2">
            {pastRecords.slice(0, 10).map((record: any) => {
              const present = record.records.filter((r: any) => r.status === "Present").length;
              const total = record.records.length;
              return (
                <div key={record._id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{new Date(record.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <span className="text-sm font-medium text-primary">{present}/{total} present ({total > 0 ? Math.round((present / total) * 100) : 0}%)</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
