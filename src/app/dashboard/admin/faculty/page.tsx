"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { Users, Plus, Search, X, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

const ROLE_OPTIONS = [
  { value: "professor", label: "Professor" },
  { value: "hod", label: "Head of Department" },
  { value: "hostel_warden", label: "Hostel Warden" },
  { value: "chief_warden", label: "Chief Warden" },
  { value: "hostel_supervisor", label: "Hostel Supervisor" },
  { value: "accountant", label: "Accountant" },
  { value: "fest_coordinator", label: "Fest Coordinator" },
];

export default function AdminFacultyPage() {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "professor",
    employeeId: "", department: "Computer Science", designation: "Assistant Professor",
    qualification: "Ph.D", contactNo: "", experience: 0, publications: 0,
    officeLocation: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/faculty?search=${search}`);
    const data = await res.json();
    if (data.success) setFaculty(data.faculty);
    setLoading(false);
  };

  useEffect(() => { fetchFaculty(); }, [search]);

  if (!user || !["super_admin", "director", "dean"].includes(user.role)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setFormData({
        name: "", email: "", password: "", role: "professor",
        employeeId: "", department: "Computer Science", designation: "Assistant Professor",
        qualification: "Ph.D", contactNo: "", experience: 0, publications: 0,
        officeLocation: "",
      });
      fetchFaculty();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider";

  const roleLabel = (r: string) => ROLE_OPTIONS.find(o => o.value === r)?.label || r;

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Manage Faculty & Staff
          </h1>
          <p className="text-muted-foreground mt-1">Add professors, wardens, coordinators, and other staff.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Staff</>}
        </button>
      </div>

      {showForm && (
        <Card className="mb-8 animate-fade-in border-primary/20">
          <CardHeader>
            <CardTitle>New Faculty / Staff Member</CardTitle>
            <CardDescription>Create an account and assign a role.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="p-5 pt-0">
            {formError && (<div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{formError}</div>)}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div><label className={labelClass}>Full Name *</label><input required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className={labelClass}>Email *</label><input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label className={labelClass}>Password *</label><input type="text" required className={inputClass} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div><label className={labelClass}>Role / Designation *</label>
                <select className={inputClass} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Employee ID *</label><input required className={inputClass} value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} /></div>
              <div><label className={labelClass}>Department</label>
                <select className={inputClass} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  <option>Computer Science</option><option>Electronics</option><option>Mechanical</option><option>Civil</option><option>Mathematics</option><option>Physics</option><option>Administration</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div><label className={labelClass}>Qualification</label><input className={inputClass} value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} /></div>
              <div><label className={labelClass}>Phone</label><input className={inputClass} value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} /></div>
              <div><label className={labelClass}>Experience (Years)</label><input type="number" min={0} className={inputClass} value={formData.experience} onChange={e => setFormData({...formData, experience: parseInt(e.target.value) || 0})} /></div>
              <div><label className={labelClass}>Publications</label><input type="number" min={0} className={inputClass} value={formData.publications} onChange={e => setFormData({...formData, publications: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Search by name or email..." className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <div className="p-1 px-5 pb-5 pt-5">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "employeeId", label: "Emp. ID", className: "font-mono text-xs" },
                { key: "name", label: "Name", className: "font-medium" },
                { key: "email", label: "Email", className: "text-xs text-muted-foreground" },
                { key: "role", label: "Role", render: (row: any) => (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">{roleLabel(row.role)}</span>
                )},
                { key: "department", label: "Dept" },
                { key: "courses", label: "Courses", render: (row: any) => (
                  <span className="text-xs text-muted-foreground">{row.courses.length > 0 ? row.courses.map((c: any) => c.code).join(", ") : "None"}</span>
                )},
                { key: "actions", label: "", render: (row: any) => (
                  <Link href={`/dashboard/admin/faculty/${row._id}`} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </Link>
                )},
              ]}
              data={faculty}
            />
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
