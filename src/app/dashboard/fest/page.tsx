"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, statusColumn } from "@/components/ui/DataTable";
import { PartyPopper, CalendarDays, IndianRupee, Users, Plus, QrCode, Ticket, Loader2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { generatePDFReceipt } from "@/lib/pdf-generator";

export default function FestDashboard() {
  const { user, login, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  // Coordinator Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [techFee, setTechFee] = useState(500);
  const [cultFee, setCultFee] = useState(500);
  const [savingSettings, setSavingSettings] = useState(false);

  // Create Event State
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    festType: "Technical"
  });

  const loadDashboard = () => {
    fetch("/api/fest/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
          setTechFee(json.data.festStats.prices?.technicalFee || 500);
          setCultFee(json.data.festStats.prices?.culturalFee || 500);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const isCoordinator = user?.role === "fest_coordinator" || user?.role === "super_admin" || user?.extraRoles?.includes("fest_coordinator");
  const isStudent = user?.role === "student";

  if (!isCoordinator && !isStudent) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          You do not have permission to view the Fest Dashboard.
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleRegister = async (festType: string) => {
    if (!confirm(`Register for ${festType} Fest? This will deduct the fee from your wallet.`)) return;
    setRegistering(festType);
    try {
      const res = await fetch("/api/fest/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ festType })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Registration Successful!");
        if (user) login({ ...user, walletBalance: resData.walletBalance });
        loadDashboard(); // Refresh UI

        // Generate PDF
        if (user) {
          generatePDFReceipt({
            transactionId: resData.transaction._id,
            date: new Date().toLocaleDateString(),
            name: user.name,
            email: user.email,
            amount: resData.transaction.amount,
            type: "Fest Registration",
            description: `${festType} Fest Entry Ticket`
          });
        }
      } else {
        alert(resData.error || "Failed to register");
      }
    } catch (e) {
      alert("Error processing registration");
    } finally {
      setRegistering(null);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings/fest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicalFee: techFee, culturalFee: cultFee })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Settings Saved!");
        loadDashboard();
        setShowSettings(false);
      } else {
        alert(resData.error);
      }
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          isPublic: true,
          organizer: user?.name,
          date: new Date(newEvent.date).toISOString()
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Event created successfully!");
        setShowCreateEvent(false);
        setNewEvent({ title: "", description: "", date: "", venue: "", festType: "Technical" });
        loadDashboard();
      } else {
        alert(resData.error || "Failed to create event");
      }
    } catch (e) {
      alert("Error adding event");
    } finally {
      setCreatingEvent(false);
    }
  };

  const festEvents = data?.festEvents || [];
  const festRegistrations = data?.festRegistrations || [];
  const festStats = data?.festStats || { totalFests: 0, totalEvents: 0, totalRegistrations: 0, totalRevenue: 0, revenueByFest: [] };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PartyPopper className="h-8 w-8 text-primary" />
            Fest Management Hub
          </h1>
          <p className="text-muted-foreground mt-1">Configure events, manage registrations, and track analytics.</p>
        </div>
        {isCoordinator ? (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium border border-border transition-colors shadow-sm"
            >
              Configure Prices
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
          <div className="flex gap-2">
            <button 
              onClick={() => handleRegister("Technical")}
              disabled={!!registering}
              className="inline-flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {registering === "Technical" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              Technical Fest Pass
            </button>
            <button 
              onClick={() => handleRegister("Cultural")}
              disabled={!!registering}
              className="inline-flex items-center gap-2 bg-pink-500 text-white hover:bg-pink-600 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {registering === "Cultural" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              Cultural Fest Pass
            </button>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-background shadow-xl">
            <CardHeader>
              <CardTitle>Create Fest Event</CardTitle>
              <CardDescription>Add a new activity to the fest schedule.</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2 text-sm">
                  <label className="font-medium">Event Title</label>
                  <input required placeholder="e.g. Robo Wars" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border rounded-md p-2 bg-background" />
                </div>
                <div className="space-y-2 text-sm">
                  <label className="font-medium">Description</label>
                  <textarea required placeholder="Event details..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full border rounded-md p-2 bg-background min-h-[80px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Date & Time</label>
                    <input required type="datetime-local" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border rounded-md p-2 bg-background" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="font-medium">Fest Category</label>
                    <select value={newEvent.festType} onChange={e => setNewEvent({...newEvent, festType: e.target.value})} className="w-full border rounded-md p-2 bg-background">
                      <option value="Technical">Technical</option>
                      <option value="Cultural">Cultural</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <label className="font-medium">Venue/Location</label>
                  <input required placeholder="e.g. Main Auditorium" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full border rounded-md p-2 bg-background" />
                </div>
                
                <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                  <button type="button" onClick={() => setShowCreateEvent(false)} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={creatingEvent} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    {creatingEvent ? "Creating..." : "Publish Event"}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {showSettings && isCoordinator && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Fest Pricing Configuration</CardTitle>
            <CardDescription>Set the entry prices for the upcoming fests</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 text-sm max-w-xs">
              <label className="font-medium">Technical Fest Fee (₹):</label>
              <input type="number" value={techFee} onChange={e => setTechFee(Number(e.target.value))} className="w-full rounded-md border p-2" />
            </div>
            <div className="flex-1 space-y-2 text-sm max-w-xs">
              <label className="font-medium">Cultural Fest Fee (₹):</label>
              <input type="number" value={cultFee} onChange={e => setCultFee(Number(e.target.value))} className="w-full rounded-md border p-2" />
            </div>
            <button onClick={handleSaveSettings} disabled={savingSettings} className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary/90">
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </Card>
      )}

      {isCoordinator ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Active Fests" value={festStats.totalFests} icon={CalendarDays} color="primary" />
          <StatCard title="Upcoming Events" value={festStats.totalEvents} icon={PartyPopper} color="info" />
          <StatCard title="Total Registrations" value={festStats.totalRegistrations} subtitle="Trending upward" icon={Users} color="success" />
          <StatCard title="Revenue Collected" value={`₹${(festStats.totalRevenue / 1000).toFixed(1)}k`} icon={IndianRupee} color="warning" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard title="My Registrations" value={festRegistrations.filter((r: any) => r.studentId === user?.id).length} icon={PartyPopper} color="primary" />
          <StatCard title="Total Paid" value={`₹${festRegistrations.filter((r: any) => r.studentId === user?.id).reduce((sum: number, r: any) => sum + r.fee, 0)}`} icon={IndianRupee} color="success" />
          <StatCard title="Upcoming Event" value="Hackathon 24hr" subtitle="April 11, Innovation Hub" icon={CalendarDays} color="info" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Catalog */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Event Catalog</CardTitle>
              <CardDescription>Browse all upcoming fest activities</CardDescription>
            </div>
            {isCoordinator && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{festEvents.length} Events</span>
            )}
          </CardHeader>
          <div className="flex-1 p-5 pt-0 overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {festEvents.map((event: any) => (
                <div key={event.id} className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">{event.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${event.status === 'Open' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : event.status === 'Full' ? 'bg-secondary text-secondary-foreground' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      {event.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{event.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{event.fest}</p>
                  
                  <div className="space-y-2 text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{event.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venue:</span>
                      <span className="font-medium truncate max-w-[120px]" title={event.venue}>{event.venue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-medium">₹{event.fee}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="text-muted-foreground text-xs">Filled:</span>
                      <span className="font-medium text-xs">{event.registrations}/{event.capacity}</span>
                    </div>
                  </div>
                  
                  {!isCoordinator && (
                    <div className="w-full mt-4 text-center bg-secondary text-secondary-foreground py-2 rounded-lg text-sm font-medium">
                      {event.status === 'Full' ? 'Sold Out' : 'Details'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Registrations Table/List */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{isCoordinator ? "Recent Logs" : "My Receipts"}</CardTitle>
            <CardDescription>Latest sign-ups</CardDescription>
          </CardHeader>
          <div className="p-1 px-5 pb-5 pt-0">
            <DataTable 
              columns={[
                { key: "event", label: "Registration Type", className: "font-medium text-sm leading-snug" },
                { key: "fee", label: "Fee", className: "text-xs tabular-nums text-muted-foreground", render: (row: any) => `₹${row.fee}` },
                statusColumn("paymentStatus", "Pmt"),
                { key: "action", label: "", render: (row: any) => 
                    <button onClick={() => alert("PDF downloaded in real flow via JS-PDF")} className="text-primary hover:text-primary/80"><Download className="h-4 w-4" /></button> 
                }
              ]}
              data={festRegistrations.filter((r: any) => isCoordinator ? true : r.studentId === user?.id)}
            />
          </div>
          
          {isCoordinator && (
            <div className="px-5 pb-5">
              <h4 className="text-sm font-bold border-t border-border pt-4 mb-3">Revenue by Fest</h4>
              <div className="space-y-3">
                {festStats.revenueByFest.map((f: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate max-w-[120px]">{f.fest}</span>
                      <span className="font-bold">₹{(f.revenue/1000).toFixed(1)}k</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(f.revenue/festStats.totalRevenue)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
