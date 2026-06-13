"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  UserCheck, UserX, Clock, Mail, Phone, Hash, GraduationCap, Briefcase,
  Building2, BookOpen, Calendar, Loader2, CheckCircle2, XCircle, Search
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await fetch("/api/admin/approvals");
      const data = await res.json();
      if (data.success) setApprovals(data.approvals);
    } catch {
      console.error("Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!user || !["super_admin", "director", "dean"].includes(user.role)) return null;

  const handleApprove = async (id: string, name: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `${name} has been approved! ✓`, type: "success" });
        setApprovals((prev) => prev.filter((a) => a._id !== id));
      } else {
        setToast({ message: data.error || "Failed to approve.", type: "error" });
      }
    } catch {
      setToast({ message: "Network error. Please try again.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const res = await fetch(`/api/admin/approvals/${rejectModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `${rejectModal.name}'s application has been declined.`, type: "success" });
        setApprovals((prev) => prev.filter((a) => a._id !== rejectModal.id));
      } else {
        setToast({ message: data.error || "Failed to reject.", type: "error" });
      }
    } catch {
      setToast({ message: "Network error. Please try again.", type: "error" });
    } finally {
      setActionLoading(null);
      setRejectModal(null);
      setRejectionReason("");
    }
  };

  const filteredApprovals = approvals.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.registrationNo && a.registrationNo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] p-4 rounded-xl shadow-xl border animate-slide-in max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Decline Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Rejecting <strong>{rejectModal.name}</strong>&apos;s application
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Reason for Rejection <span className="text-muted-foreground">(sent via email)</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid enrollment number, documents not matching..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setRejectModal(null); setRejectionReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-muted transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {actionLoading === rejectModal.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            Pending Approvals
            {approvals.length > 0 && (
              <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-bold border border-amber-500/20">
                {approvals.length}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve new user registrations.
          </p>
        </div>
      </div>

      {/* Search */}
      {approvals.length > 0 && (
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by name, email, or registration no..."
            className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : filteredApprovals.length === 0 ? (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">All Caught Up! 🎉</h2>
          <p className="text-muted-foreground max-w-sm">
            {search
              ? "No matching registrations found."
              : "There are no pending registrations to review right now."}
          </p>
        </Card>
      ) : (
        /* Approval Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">
          {filteredApprovals.map((entry) => (
            <Card
              key={entry._id}
              className="border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden"
            >
              {/* Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

              <div className="p-5">
                {/* Top Row: Name + Role Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                      {entry.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{entry.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3" />
                        {entry.email}
                      </div>
                    </div>
                  </div>
                  <Badge variant={entry.role === "student" ? "info" : "default"}>
                    {entry.role === "student" ? (
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Student</span>
                    ) : (
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Faculty</span>
                    )}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      <span className="text-foreground font-medium">{entry.registrationNo}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground">{entry.contactNo}</span>
                  </div>

                  {entry.role === "student" ? (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground">{entry.course} — {entry.branch}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground">Sem {entry.semester} · Sec {entry.section} · {entry.admissionYear}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground">{entry.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground">{entry.designation} · {entry.qualification}</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs">
                      Applied {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at{" "}
                      {new Date(entry.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(entry._id, entry.name)}
                    disabled={actionLoading === entry._id}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm shadow-emerald-500/20"
                  >
                    {actionLoading === entry._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: entry._id, name: entry.name })}
                    disabled={actionLoading === entry._id}
                    className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-500 font-medium hover:bg-red-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <UserX className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
