"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import {
  PartyPopper, CalendarDays, IndianRupee, Users, Plus, Ticket, Loader2,
  ArrowLeft, Cpu, Palette, UserPlus, X, CheckCircle, AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { generatePDFReceipt } from "@/lib/pdf-generator";

export default function FestDetailPage() {
  const { user, login, isLoading: authLoading } = useAuth();
  const params = useParams();
  const festSlug = (params.festType as string) || "";
  const festType = festSlug.charAt(0).toUpperCase() + festSlug.slice(1); // "technical" -> "Technical"

  const [dashData, setDashData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Coordinator: Settings
  const [showSettings, setShowSettings] = useState(false);
  const [festFee, setFestFee] = useState(500);
  const [savingSettings, setSavingSettings] = useState(false);

  // Coordinator: Create Event
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", date: "", venue: "",
    minTeamSize: 1, maxTeamSize: 1, capacity: 100,
  });

  // Student: Event Registration
  const [showEventRegModal, setShowEventRegModal] = useState<any>(null);
  const [eventRegLoading, setEventRegLoading] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const isCoordinator = user?.role === "fest_coordinator" || user?.role === "super_admin" || user?.extraRoles?.includes("fest_coordinator");
  const isStudent = user?.role === "student";

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/fest/dashboard").then(r => r.json()),
      fetch(`/api/fest/events?festType=${festType}`).then(r => r.json()),
    ]).then(([dashJson, eventsJson]) => {
      if (dashJson.success) {
        setDashData(dashJson.data);
        const prices = dashJson.data.festStats?.prices || {};
        setFestFee(festType === "Technical" ? prices.technicalFee || 500 : prices.culturalFee || 500);
      }
      if (eventsJson.success) setEvents(eventsJson.events || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (festType === "Technical" || festType === "Cultural") {
      loadData();
    }
  }, [festType]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (festType !== "Technical" && festType !== "Cultural") {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Invalid fest type. Please select Technical or Cultural.</div>
      </DashboardLayout>
    );
  }

  if (!isCoordinator && !isStudent) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">You do not have permission to view this page.</div>
      </DashboardLayout>
    );
  }

  const hasFestPass = dashData?.userFestPasses?.[festType] || false;
  const festInfo = dashData?.festStats?.revenueByFest?.find((f: any) => f.fest === festType + " Fest") || {};
  const festColor = festType === "Technical" ? "blue" : "pink";
  const FestIcon = festType === "Technical" ? Cpu : Palette;

  // Handle fest pass registration
  const handleRegisterFest = async () => {
    if (!confirm(`Register for ${festType} Fest? Fee: ₹${festFee} will be deducted from your wallet.`)) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/fest/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ festType })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Fest registration successful!");
        if (user) login({ ...user, walletBalance: resData.walletBalance });
        if (user) {
          generatePDFReceipt({
            transactionId: resData.transaction._id,
            date: new Date().toLocaleDateString(),
            name: user.name,
            email: user.email,
            amount: resData.transaction.amount,
            type: "Fest Registration",
            description: `${festType} Fest Entry Pass`
          });
        }
        loadData();
      } else {
        alert(resData.error || "Failed to register");
      }
    } catch {
      alert("Error processing registration");
    } finally {
      setRegistering(false);
    }
  };

  // Handle save pricing
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const prices = dashData?.festStats?.prices || {};
      const body = festType === "Technical"
        ? { technicalFee: festFee, culturalFee: prices.culturalFee || 500 }
        : { technicalFee: prices.technicalFee || 500, culturalFee: festFee };

      const res = await fetch("/api/settings/fest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Settings saved!");
        setShowSettings(false);
        loadData();
      } else {
        alert(resData.error);
      }
    } catch {
      alert("Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          festType,
          isPublic: true,
          organizer: user?.name,
          date: new Date(newEvent.date).toISOString()
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Event created!");
        setShowCreateEvent(false);
        setNewEvent({ title: "", description: "", date: "", venue: "", minTeamSize: 1, maxTeamSize: 1, capacity: 100 });
        loadData();
      } else {
        alert(resData.error || "Failed to create event");
      }
    } catch {
      alert("Error creating event");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Handle event registration
  const handleEventRegister = async () => {
    setEventRegLoading(true);
    try {
      const res = await fetch("/api/fest/event-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: showEventRegModal.id,
          teamName: teamName || undefined,
          teamMembers: teamEmails.length > 0 ? teamEmails : undefined,
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Successfully registered for event!");
        setShowEventRegModal(null);
        setTeamName("");
        setTeamEmails([]);
        setNewMemberEmail("");
        loadData();
      } else {
        alert(resData.error || "Registration failed");
      }
    } catch {
      alert("Error registering for event");
    } finally {
      setEventRegLoading(false);
    }
  };

  const addTeamMember = () => {
    const email = newMemberEmail.trim().toLowerCase();
    if (!email) return;
    if (email === user?.email) {
      alert("You are automatically added as the team leader.");
      return;
    }
    if (teamEmails.includes(email)) {
      alert("This email is already added.");
      return;
    }
    setTeamEmails([...teamEmails, email]);
    setNewMemberEmail("");
  };

  // Check if user already registered for an event
  const isRegisteredForEvent = (event: any) => {
    return event.registrations?.some(
      (r: any) => r.leaderId === user?.id || r.teamMembers?.some((m: any) => m.id === user?.id)
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/fest" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Fests
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-${festColor}-500/10 flex items-center justify-center`}>
              <FestIcon className={`h-6 w-6 text-${festColor}-500`} />
            </div>
            {festType} Fest
          </h1>
          <p className="text-muted-foreground mt-1">
            {festType === "Technical"
              ? "Hackathons, coding challenges, robotics, and innovation events."
              : "Dance, music, drama, art exhibitions, and cultural events."}
          </p>
        </div>
        {isCoordinator ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium border border-border transition-colors shadow-sm"
            >
              Configure Price
            </button>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        ) : (
          <div>
            {hasFestPass ? (
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl font-medium">
                <CheckCircle className="h-4 w-4" />
                Fest Pass Active
              </div>
            ) : (
              <button
                onClick={handleRegisterFest}
                disabled={registering}
                className={`inline-flex items-center gap-2 bg-${festColor}-500 text-white hover:bg-${festColor}-600 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50`}
              >
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
                Buy Fest Pass · ₹{festFee}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pricing Settings (Coordinator) */}
      {showSettings && isCoordinator && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">{festType} Fest Pricing</CardTitle>
            <CardDescription>Set the registration fee for {festType} Fest</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 text-sm max-w-xs">
              <label className="font-medium">Registration Fee (₹):</label>
              <input type="number" value={festFee} onChange={e => setFestFee(Number(e.target.value))} className="w-full rounded-xl border p-2.5 bg-background" />
            </div>
            <button onClick={handleSaveSettings} disabled={savingSettings} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50">
              {savingSettings ? "Saving..." : "Save"}
            </button>
          </div>
        </Card>
      )}

      {/* Stats */}
      {isCoordinator && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
          <StatCard title="Events" value={events.length} icon={CalendarDays} color="primary" />
          <StatCard title="Fest Passes Sold" value={festInfo.registrations || 0} icon={Users} color="success" />
          <StatCard title="Event Entries" value={festInfo.eventRegistrations || 0} icon={PartyPopper} color="info" />
          <StatCard title="Revenue" value={`₹${((festInfo.revenue || 0) / 1000).toFixed(1)}k`} icon={IndianRupee} color="warning" />
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-background shadow-xl">
            <CardHeader>
              <CardTitle>Create {festType} Fest Event</CardTitle>
              <CardDescription>Add a new event to the {festType} fest schedule.</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2 text-sm">
                  <label className="font-medium">Event Title</label>
                  <input required placeholder="e.g. Robo Wars" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full border rounded-xl p-2.5 bg-background" />
                </div>
                <div className="space-y-2 text-sm">
                  <label className="font-medium">Description</label>
                  <textarea required placeholder="Event details..." value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="w-full border rounded-xl p-2.5 bg-background min-h-[80px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Date & Time</label>
                    <input required type="datetime-local" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full border rounded-xl p-2.5 bg-background" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Venue</label>
                    <input required placeholder="e.g. Main Auditorium" value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} className="w-full border rounded-xl p-2.5 bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Min Team Size</label>
                    <input type="number" min={1} value={newEvent.minTeamSize} onChange={e => setNewEvent({ ...newEvent, minTeamSize: Number(e.target.value) })} className="w-full border rounded-xl p-2.5 bg-background" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Max Team Size</label>
                    <input type="number" min={1} value={newEvent.maxTeamSize} onChange={e => setNewEvent({ ...newEvent, maxTeamSize: Number(e.target.value) })} className="w-full border rounded-xl p-2.5 bg-background" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Capacity</label>
                    <input type="number" min={1} value={newEvent.capacity} onChange={e => setNewEvent({ ...newEvent, capacity: Number(e.target.value) })} className="w-full border rounded-xl p-2.5 bg-background" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Min/Max team size defines team members per registration. Capacity is total registrations allowed.
                  {newEvent.maxTeamSize > 1 && " Participants will be able to add team members when registering."}
                </p>
                <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                  <button type="button" onClick={() => setShowCreateEvent(false)} className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={creatingEvent} className="px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50">
                    {creatingEvent ? "Creating..." : "Publish Event"}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Event Registration Modal */}
      {showEventRegModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-background shadow-xl">
            <CardHeader>
              <CardTitle>Register for {showEventRegModal.title}</CardTitle>
              <CardDescription>
                {showEventRegModal.maxTeamSize > 1
                  ? `Team event · ${showEventRegModal.minTeamSize}–${showEventRegModal.maxTeamSize} members`
                  : "Individual event"}
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 space-y-4">
              {showEventRegModal.maxTeamSize > 1 && (
                <>
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Team Name (optional)</label>
                    <input
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="e.g. Code Warriors"
                      className="w-full border rounded-xl p-2.5 bg-background"
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Add Team Members (by email)</label>
                    <p className="text-xs text-muted-foreground">You are the team leader. Add {showEventRegModal.minTeamSize - 1} to {showEventRegModal.maxTeamSize - 1} more student(s). They must have a {festType} Fest pass.</p>
                    <div className="flex gap-2">
                      <input
                        value={newMemberEmail}
                        onChange={e => setNewMemberEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTeamMember(); } }}
                        placeholder="student@email.com"
                        className="w-full border rounded-xl p-2.5 bg-background"
                      />
                      <button type="button" onClick={addTeamMember} className="shrink-0 bg-primary text-primary-foreground px-3 py-2 rounded-xl hover:bg-primary/90">
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {teamEmails.length > 0 && (
                    <div className="space-y-2">
                      {teamEmails.map((email, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2 text-sm">
                          <span>{email}</span>
                          <button onClick={() => setTeamEmails(teamEmails.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">Team: You + {teamEmails.length} member{teamEmails.length > 1 ? "s" : ""} = {1 + teamEmails.length} total</p>
                    </div>
                  )}
                </>
              )}

              {/* Validation feedback */}
              {showEventRegModal.maxTeamSize > 1 && (1 + teamEmails.length) < showEventRegModal.minTeamSize && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Need at least {showEventRegModal.minTeamSize - 1 - teamEmails.length} more member(s)
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t">
                <button
                  onClick={() => { setShowEventRegModal(null); setTeamEmails([]); setTeamName(""); setNewMemberEmail(""); }}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEventRegister}
                  disabled={eventRegLoading || (showEventRegModal.maxTeamSize > 1 && (1 + teamEmails.length) < showEventRegModal.minTeamSize)}
                  className="px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  {eventRegLoading ? "Registering..." : "Confirm Registration"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Events</CardTitle>
                <CardDescription>{events.length} event{events.length !== 1 ? "s" : ""} in {festType} Fest</CardDescription>
              </div>
            </CardHeader>
            <div className="p-5 pt-0">
              {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No events yet.</p>
                  {isCoordinator && <p className="text-sm mt-1">Create one using the button above.</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.map((event: any) => {
                    const isFull = event.registrationCount >= event.capacity;
                    const alreadyRegistered = isRegisteredForEvent(event);
                    return (
                      <div key={event.id} className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {event.maxTeamSize > 1 ? `Team (${event.minTeamSize}-${event.maxTeamSize})` : "Solo"}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isFull
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {isFull ? "Full" : "Open"}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{event.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>

                        <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{event.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Venue:</span>
                            <span className="font-medium truncate max-w-[140px]" title={event.venue}>{event.venue}</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-1 mt-1">
                            <span className="text-muted-foreground text-xs">Registered:</span>
                            <span className="font-medium text-xs">{event.registrationCount}/{event.capacity}</span>
                          </div>
                        </div>

                        {isStudent && (
                          <div className="mt-3">
                            {alreadyRegistered ? (
                              <div className="w-full text-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-2 rounded-xl text-sm font-medium border border-emerald-500/20">
                                ✓ Registered
                              </div>
                            ) : !hasFestPass ? (
                              <div className="w-full text-center bg-amber-500/10 text-amber-600 dark:text-amber-400 py-2 rounded-xl text-sm font-medium border border-amber-500/20">
                                Buy fest pass first
                              </div>
                            ) : isFull ? (
                              <div className="w-full text-center bg-secondary text-secondary-foreground py-2 rounded-xl text-sm font-medium">
                                Sold Out
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowEventRegModal(event)}
                                className="w-full text-center bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                              >
                                Register for Event
                              </button>
                            )}
                          </div>
                        )}

                        {isCoordinator && (
                          <div className="mt-3">
                            <div className="w-full text-center bg-muted text-muted-foreground py-2 rounded-xl text-sm font-medium">
                              {event.registrationCount} Registration{event.registrationCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Registrations Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{isCoordinator ? "Registration Log" : "My Registrations"}</CardTitle>
              <CardDescription>Event participation details</CardDescription>
            </CardHeader>
            <div className="p-5 pt-0 space-y-3 max-h-[500px] overflow-y-auto">
              {events.filter(e => e.registrations?.length > 0).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No registrations yet.</p>
              ) : (
                events.map((event: any) => {
                  const regs = isCoordinator
                    ? event.registrations
                    : event.registrations?.filter((r: any) => r.leaderId === user?.id || r.teamMembers?.some((m: any) => m.id === user?.id));

                  if (!regs || regs.length === 0) return null;

                  return (
                    <div key={event.id} className="border border-border rounded-xl p-3">
                      <p className="font-medium text-sm mb-2">{event.title}</p>
                      {regs.map((r: any) => (
                        <div key={r.id} className="bg-muted/30 rounded-lg p-2 text-xs space-y-1 mb-2 last:mb-0">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Leader:</span>
                            <span className="font-medium">{r.leaderName}</span>
                          </div>
                          {r.teamName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Team:</span>
                              <span className="font-medium">{r.teamName}</span>
                            </div>
                          )}
                          {r.teamMembers?.length > 1 && (
                            <div>
                              <span className="text-muted-foreground">Members:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {r.teamMembers.map((m: any) => (
                                  <span key={m.id} className="bg-background border border-border rounded-full px-2 py-0.5 text-[10px]">
                                    {m.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
