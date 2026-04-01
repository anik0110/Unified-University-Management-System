"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "", contactNo: "", bloodGroup: "", semester: 1, section: "",
    cgpa: 0, sgpa: 0, hostelBlock: "", hostelRoom: "",
  });
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [studentRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/students/${id}`),
        fetch("/api/admin/courses"),
      ]);
      const studentData = await studentRes.json();
      const coursesData = await coursesRes.json();

      if (studentData.success) {
        const s = studentData.student;
        setStudent(s);
        setForm({
          name: s.name || "", contactNo: s.profile?.contactNo || "",
          bloodGroup: s.profile?.bloodGroup || "Unknown",
          semester: s.profile?.semester || 1, section: s.profile?.section || "",
          cgpa: s.profile?.cgpa || 0, sgpa: s.profile?.sgpa || 0,
          hostelBlock: s.profile?.hostelDetails?.block || "",
          hostelRoom: s.profile?.hostelDetails?.roomNo || "",
        });
        setCourses(s.courses || []);
        setSelectedCourseIds((s.courses || []).map((c: any) => c._id));
      }
      if (coursesData.success) setAllCourses(coursesData.courses);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (!user || !["super_admin", "director", "dean"].includes(user.role)) return null;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, courseIds: selectedCourseIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Student updated successfully!");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/admin/students" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Student: {student?.name}</h1>
          <p className="text-sm text-muted-foreground">{student?.email} • {student?.profile?.enrollmentNo}</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update student personal and academic info</CardDescription>
          </CardHeader>
          <div className="p-5 pt-0 space-y-4">
            <div><label className={labelClass}>Full Name</label><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Semester</label><input type="number" min={1} max={8} className={inputClass} value={form.semester} onChange={e => setForm({...form, semester: parseInt(e.target.value) || 1})} /></div>
              <div><label className={labelClass}>Section</label><input className={inputClass} value={form.section} onChange={e => setForm({...form, section: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>CGPA</label><input type="number" step="0.01" min={0} max={10} className={inputClass} value={form.cgpa} onChange={e => setForm({...form, cgpa: parseFloat(e.target.value) || 0})} /></div>
              <div><label className={labelClass}>SGPA</label><input type="number" step="0.01" min={0} max={10} className={inputClass} value={form.sgpa} onChange={e => setForm({...form, sgpa: parseFloat(e.target.value) || 0})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Phone</label><input className={inputClass} value={form.contactNo} onChange={e => setForm({...form, contactNo: e.target.value})} /></div>
              <div><label className={labelClass}>Blood Group</label>
                <select className={inputClass} value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                  <option>Unknown</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Hostel Block</label><input className={inputClass} value={form.hostelBlock} onChange={e => setForm({...form, hostelBlock: e.target.value})} /></div>
              <div><label className={labelClass}>Hostel Room</label><input className={inputClass} value={form.hostelRoom} onChange={e => setForm({...form, hostelRoom: e.target.value})} /></div>
            </div>
          </div>
        </Card>

        {/* Course Enrollment */}
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollment</CardTitle>
            <CardDescription>Select courses to enroll this student in</CardDescription>
          </CardHeader>
          <div className="p-5 pt-0 space-y-2 max-h-[400px] overflow-y-auto">
            {allCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No courses created yet. Create courses first from the Courses page.</p>
            ) : (
              allCourses.map((course: any) => (
                <label key={course._id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(course._id)}
                    onChange={() => toggleCourse(course._id)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground">{course.code}</span>
                    <span className="ml-2 font-medium text-sm">{course.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({course.credits} cr)</span>
                  </div>
                  {course.faculty && <span className="text-xs text-muted-foreground">{course.faculty.name}</span>}
                </label>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>
    </DashboardLayout>
  );
}
