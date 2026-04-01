"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { MessageSquare, Calendar, Megaphone, Plus, X, Trash2, Pencil, Send, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

type Tab = "notices" | "events";

export default function CommunicationPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("notices");
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Notice form
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", category: "Academic", isPublic: false });
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", venue: "", organizer: "", isPublic: true });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const canPost = user && ["super_admin", "director", "dean", "hod", "professor", "fest_coordinator"].includes(user.role);

  const fetchData = async () => {
    setLoading(true);
    const [nRes, eRes] = await Promise.all([
      fetch("/api/notices"), fetch("/api/events"),
    ]);
    const nData = await nRes.json();
    const eData = await eRes.json();
    if (nData.success) setNotices(nData.notices);
    if (eData.success) setEvents(eData.events);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (!user) return null;

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const url = editingNoticeId ? `/api/notices/${editingNoticeId}` : "/api/notices";
      const method = editingNoticeId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(noticeForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowNoticeForm(false);
      setEditingNoticeId(null);
      setNoticeForm({ title: "", content: "", category: "Academic", isPublic: false });
      fetchData();
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const url = editingEventId ? `/api/events/${editingEventId}` : "/api/events";
      const method = editingEventId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowEventForm(false);
      setEditingEventId(null);
      setEventForm({ title: "", description: "", date: "", venue: "", organizer: "", isPublic: true });
      fetchData();
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    await fetch(`/api/notices/${id}`, { method: "DELETE" });
    fetchData();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    fetchData();
  };

  const startEditNotice = (notice: any) => {
    setNoticeForm({ title: notice.title, content: notice.content, category: notice.category, isPublic: notice.isPublic });
    setEditingNoticeId(notice._id);
    setShowNoticeForm(true);
  };

  const startEditEvent = (event: any) => {
    setEventForm({ title: event.title, description: event.description, date: new Date(event.date).toISOString().split("T")[0], venue: event.venue, organizer: event.organizer, isPublic: event.isPublic });
    setEditingEventId(event._id);
    setShowEventForm(true);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block";
  const categoryColors: Record<string, string> = {
    Academic: "bg-blue-500/10 text-blue-600", Administrative: "bg-violet-500/10 text-violet-600",
    Event: "bg-emerald-500/10 text-emerald-600", Library: "bg-amber-500/10 text-amber-600",
    Hostel: "bg-pink-500/10 text-pink-600", General: "bg-slate-500/10 text-slate-600",
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" /> Communication Hub
          </h1>
          <p className="text-muted-foreground mt-1">Notices, events, and messaging.</p>
        </div>
        <Link href="/dashboard/communication/messages" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Send className="h-4 w-4" /> Messages
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
        {(["notices", "events"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "notices" ? <><Megaphone className="h-4 w-4 inline mr-1.5" />Notices</> : <><Calendar className="h-4 w-4 inline mr-1.5" />Events</>}
          </button>
        ))}
      </div>

      {/* Notices Tab */}
      {tab === "notices" && (
        <>
          {canPost && (
            <div className="mb-6">
              <button onClick={() => { setShowNoticeForm(!showNoticeForm); setEditingNoticeId(null); setNoticeForm({ title: "", content: "", category: "Academic", isPublic: false }); }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                {showNoticeForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Post Notice</>}
              </button>
            </div>
          )}

          {showNoticeForm && (
            <Card className="mb-6 border-primary/20 animate-fade-in">
              <CardHeader><CardTitle>{editingNoticeId ? "Edit Notice" : "Post a Notice"}</CardTitle></CardHeader>
              <form onSubmit={handleNoticeSubmit} className="p-5 pt-0">
                {formError && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><label className={labelClass}>Title *</label><input required className={inputClass} value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} /></div>
                  <div><label className={labelClass}>Category *</label>
                    <select className={inputClass} value={noticeForm.category} onChange={e => setNoticeForm({...noticeForm, category: e.target.value})}>
                      <option>Academic</option><option>Administrative</option><option>Event</option><option>Library</option><option>Hostel</option><option>General</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4"><label className={labelClass}>Content *</label><textarea required rows={3} className={inputClass} value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} /></div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={noticeForm.isPublic} onChange={e => setNoticeForm({...noticeForm, isPublic: e.target.checked})} className="w-4 h-4 rounded" /> Show on landing page</label>
                  <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
                    {submitting ? "Saving..." : editingNoticeId ? "Update Notice" : "Post Notice"}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
            ) : notices.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No notices posted yet.</Card>
            ) : (
              notices.map((notice: any) => (
                <Card key={notice._id} className="group hover:border-primary/30 transition-colors">
                  <div className="p-4 flex gap-4">
                    <div className="mt-1.5 h-3 w-3 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium">{notice.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium shrink-0 ${categoryColors[notice.category] || categoryColors.General}`}>{notice.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notice.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>by {notice.authorId?.name || "Admin"}</span>
                        {notice.isPublic && <span className="text-primary font-medium">• Public</span>}
                      </div>
                    </div>
                    {canPost && (notice.authorId?._id === user.id || ["super_admin", "director", "dean"].includes(user.role)) && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditNotice(notice)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteNotice(notice._id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Events Tab */}
      {tab === "events" && (
        <>
          {canPost && (
            <div className="mb-6">
              <button onClick={() => { setShowEventForm(!showEventForm); setEditingEventId(null); setEventForm({ title: "", description: "", date: "", venue: "", organizer: "", isPublic: true }); }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                {showEventForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Create Event</>}
              </button>
            </div>
          )}

          {showEventForm && (
            <Card className="mb-6 border-primary/20 animate-fade-in">
              <CardHeader><CardTitle>{editingEventId ? "Edit Event" : "Create an Event"}</CardTitle></CardHeader>
              <form onSubmit={handleEventSubmit} className="p-5 pt-0">
                {formError && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><label className={labelClass}>Title *</label><input required className={inputClass} value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} /></div>
                  <div><label className={labelClass}>Date *</label><input type="date" required className={inputClass} value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><label className={labelClass}>Venue *</label><input required className={inputClass} value={eventForm.venue} onChange={e => setEventForm({...eventForm, venue: e.target.value})} /></div>
                  <div><label className={labelClass}>Organizer</label><input className={inputClass} value={eventForm.organizer} onChange={e => setEventForm({...eventForm, organizer: e.target.value})} /></div>
                </div>
                <div className="mb-4"><label className={labelClass}>Description *</label><textarea required rows={3} className={inputClass} value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} /></div>
                <div className="flex justify-end">
                  <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
                    {submitting ? "Saving..." : editingEventId ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
            ) : events.length === 0 ? (
              <Card className="col-span-2 p-8 text-center text-muted-foreground">No events created yet.</Card>
            ) : (
              events.map((event: any) => (
                <Card key={event._id} className="group hover:border-primary/30 transition-colors overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      {canPost && (event.authorId?._id === user.id || ["super_admin", "director", "dean"].includes(user.role)) && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditEvent(event)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => deleteEvent(event._id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>📍 {event.venue}</span>
                      {event.organizer && <span>🏢 {event.organizer}</span>}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
