"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { BookOpen, Plus, X, Pencil, Trash2, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "", name: "", credits: 3, type: "Core",
    program: "B.Tech CS", semester: 1, facultyId: "",
  });
  const [editData, setEditData] = useState({
    name: "", credits: 3, type: "Core",
    program: "", semester: 1, facultyId: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [coursesRes, facultyRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/faculty"),
    ]);
    const coursesData = await coursesRes.json();
    const facultyData = await facultyRes.json();
    if (coursesData.success) setCourses(coursesData.courses);
    if (facultyData.success) setFaculty(facultyData.faculty.filter((f: any) => ["professor", "hod"].includes(f.role)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (!user || !["super_admin", "director", "dean"].includes(user.role)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setFormData({ code: "", name: "", credits: 3, type: "Core", program: "B.Tech CS", semester: 1, facultyId: "" });
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (course: any) => {
    setEditingId(course._id);
    setEditData({
      name: course.name,
      credits: course.credits,
      type: course.type,
      program: course.program,
      semester: course.semester,
      facultyId: course.faculty?._id || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/courses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course? This will also remove it from all students and faculty.")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    fetchData();
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider";
  const editInputClass = "px-2 py-1 rounded-md border border-primary/30 bg-background text-sm focus:ring-2 focus:ring-primary outline-none w-full";

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" /> Course Management
          </h1>
          <p className="text-muted-foreground mt-1">Create, edit, and manage university courses.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Course</>}
        </button>
      </div>

      {showForm && (
        <Card className="mb-8 animate-fade-in border-primary/20">
          <CardHeader><CardTitle>New Course</CardTitle></CardHeader>
          <form onSubmit={handleSubmit} className="p-5 pt-0">
            {formError && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{formError}</div>)}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div><label className={labelClass}>Code *</label><input required className={inputClass} placeholder="CS301" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Course Name *</label><input required className={inputClass} placeholder="Data Structures & Algorithms" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className={labelClass}>Credits *</label><input type="number" min={1} max={6} required className={inputClass} value={formData.credits} onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div><label className={labelClass}>Type</label>
                <select className={inputClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Core</option><option>Elective</option>
                </select>
              </div>
              <div><label className={labelClass}>Program</label><input className={inputClass} placeholder="B.Tech CS" value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} /></div>
              <div><label className={labelClass}>Semester</label><input type="number" min={1} max={8} className={inputClass} value={formData.semester} onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})} /></div>
              <div><label className={labelClass}>Assign Faculty</label>
                <select className={inputClass} value={formData.facultyId} onChange={e => setFormData({...formData, facultyId: e.target.value})}>
                  <option value="">Unassigned</option>
                  {faculty.map((f: any) => <option key={f._id} value={f._id}>{f.name} ({f.department})</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="p-1 px-5 pb-5 pt-5">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
          ) : courses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No courses yet. Click &quot;Add Course&quot; to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-3 px-2 font-medium">Code</th>
                    <th className="py-3 px-2 font-medium">Course Name</th>
                    <th className="py-3 px-2 font-medium">Credits</th>
                    <th className="py-3 px-2 font-medium">Type</th>
                    <th className="py-3 px-2 font-medium">Program</th>
                    <th className="py-3 px-2 font-medium">Sem</th>
                    <th className="py-3 px-2 font-medium">Faculty</th>
                    <th className="py-3 px-2 font-medium">Students</th>
                    <th className="py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course: any) => (
                    <tr key={course._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-mono text-xs font-medium">{course.code}</td>

                      {editingId === course._id ? (
                        <>
                          <td className="py-2 px-2"><input className={editInputClass} value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} /></td>
                          <td className="py-2 px-2"><input type="number" min={1} max={6} className={editInputClass + " w-16"} value={editData.credits} onChange={e => setEditData({...editData, credits: parseInt(e.target.value) || 1})} /></td>
                          <td className="py-2 px-2">
                            <select className={editInputClass + " w-24"} value={editData.type} onChange={e => setEditData({...editData, type: e.target.value})}>
                              <option>Core</option><option>Elective</option>
                            </select>
                          </td>
                          <td className="py-2 px-2"><input className={editInputClass} value={editData.program} onChange={e => setEditData({...editData, program: e.target.value})} /></td>
                          <td className="py-2 px-2"><input type="number" min={1} max={8} className={editInputClass + " w-16"} value={editData.semester} onChange={e => setEditData({...editData, semester: parseInt(e.target.value) || 1})} /></td>
                          <td className="py-2 px-2">
                            <select className={editInputClass} value={editData.facultyId} onChange={e => setEditData({...editData, facultyId: e.target.value})}>
                              <option value="">Unassigned</option>
                              {faculty.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
                            </select>
                          </td>
                          <td className="py-3 px-2">{course.enrolledCount}</td>
                          <td className="py-2 px-2">
                            <div className="flex gap-1">
                              <button onClick={handleSaveEdit} disabled={submitting} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Save">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Cancel">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-2 font-medium">{course.name}</td>
                          <td className="py-3 px-2">{course.credits}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${course.type === "Core" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"}`}>{course.type}</span>
                          </td>
                          <td className="py-3 px-2">{course.program}</td>
                          <td className="py-3 px-2">{course.semester}</td>
                          <td className="py-3 px-2">{course.faculty?.name || <span className="text-muted-foreground">Unassigned</span>}</td>
                          <td className="py-3 px-2">{course.enrolledCount}</td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(course)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Edit">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(course._id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
