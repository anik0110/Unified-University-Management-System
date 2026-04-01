"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Users, Plus, Search, X, Eye, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", enrollmentNo: "",
    course: "B.Tech", branch: "Computer Science", semester: 1,
    section: "A", admissionYear: new Date().getFullYear(),
    contactNo: "", bloodGroup: "Unknown", parentContact: "",
    address: "", hostelBlock: "", hostelRoom: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/students?search=${search}`);
    const data = await res.json();
    if (data.success) setStudents(data.students);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [search]);

  if (!user || !["super_admin", "director", "dean"].includes(user.role)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setFormData({
        name: "", email: "", password: "", enrollmentNo: "",
        course: "B.Tech", branch: "Computer Science", semester: 1,
        section: "A", admissionYear: new Date().getFullYear(),
        contactNo: "", bloodGroup: "Unknown", parentContact: "",
        address: "", hostelBlock: "", hostelRoom: "",
      });
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    fetchStudents();
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider";

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Manage Students
          </h1>
          <p className="text-muted-foreground mt-1">Add, edit, and manage student accounts.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Student</>}
        </button>
      </div>

      {showForm && (
        <Card className="mb-8 animate-fade-in border-primary/20">
          <CardHeader>
            <CardTitle>New Student Admission</CardTitle>
            <CardDescription>Create a student account with login credentials.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="p-5 pt-0">
            {formError && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{formError}</div>)}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div><label className={labelClass}>Full Name *</label><input required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className={labelClass}>Email *</label><input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label className={labelClass}>Password *</label><input type="text" required className={inputClass} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div><label className={labelClass}>Enrollment No. *</label><input required className={inputClass} value={formData.enrollmentNo} onChange={e => setFormData({...formData, enrollmentNo: e.target.value})} /></div>
              <div><label className={labelClass}>Course</label>
                <select className={inputClass} value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})}>
                  <option>B.Tech</option><option>M.Tech</option><option>BCA</option><option>MCA</option><option>MBA</option>
                </select>
              </div>
              <div><label className={labelClass}>Branch</label>
                <select className={inputClass} value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                  <option>Computer Science</option><option>Electronics</option><option>Mechanical</option><option>Civil</option><option>Electrical</option>
                </select>
              </div>
              <div><label className={labelClass}>Semester</label><input type="number" min={1} max={8} className={inputClass} value={formData.semester} onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div><label className={labelClass}>Section</label><input className={inputClass} value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} /></div>
              <div><label className={labelClass}>Admission Year</label><input type="number" className={inputClass} value={formData.admissionYear} onChange={e => setFormData({...formData, admissionYear: parseInt(e.target.value)})} /></div>
              <div><label className={labelClass}>Phone</label><input className={inputClass} value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} /></div>
              <div><label className={labelClass}>Blood Group</label>
                <select className={inputClass} value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                  <option>Unknown</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><label className={labelClass}>Hostel Block</label><input className={inputClass} placeholder="e.g. A" value={formData.hostelBlock} onChange={e => setFormData({...formData, hostelBlock: e.target.value})} /></div>
              <div><label className={labelClass}>Hostel Room</label><input className={inputClass} placeholder="e.g. A-204" value={formData.hostelRoom} onChange={e => setFormData({...formData, hostelRoom: e.target.value})} /></div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? "Creating..." : "Create Student Account"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search by name or email..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Students Table */}
      <Card>
        <div className="p-1 px-5 pb-5 pt-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={[
                { key: "enrollmentNo", label: "Reg. No.", className: "font-mono text-xs" },
                { key: "name", label: "Name", className: "font-medium" },
                { key: "email", label: "Email", className: "text-xs text-muted-foreground" },
                { key: "branch", label: "Branch" },
                { key: "semester", label: "Sem" },
                { key: "cgpa", label: "CGPA", render: (row: any) => <span className="font-semibold text-primary">{row.cgpa || 0}</span> },
                { key: "bloodGroup", label: "Blood" },
                {
                  key: "actions", label: "Actions",
                  render: (row: any) => (
                    <div className="flex gap-1">
                      <Link href={`/dashboard/admin/students/${row._id}`} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(row._id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={students}
            />
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
