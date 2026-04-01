"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ArrowRight, BookOpen, Building2, Users, Calendar, Megaphone, Laptop, Globe, Handshake, Search } from "lucide-react";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Public Data
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [noticesRes, eventsRes] = await Promise.all([
          fetch("/api/notices/public"),
          fetch("/api/events/public")
        ]);
        
        if (noticesRes.ok) {
          const data = await noticesRes.json();
          setNotices(data.notices || []);
        }
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error("Failed to fetch public stats");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-background/70 border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground h-10 w-10 flex items-center justify-center rounded-xl font-bold text-xl shadow-lg ring-2 ring-primary/20">U</div>
          <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 hidden sm:block">UUMS</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-all focus:outline-none">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link href="/auth/login" className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden">
          {/* Decorative Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Unified Connectivity for Higher Ed
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto mb-8 animate-slide-up leading-tight">
            The intelligent operating system for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">university.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Unify student lifecycle, finance, hostel, and faculty experiences inside one seamless, high-performance platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/login" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-full shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all text-lg relative group overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
              Sign In to Portal <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="bg-muted/30 py-24 border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Empowering Everyone</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">11 distinct roles covering every aspect of university operations.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Student Portal', text: 'Academics, fees, and attendance.', icon: BookOpen },
                { title: 'Faculty Hub', text: 'Manage classes and analytics.', icon: Laptop },
                { title: 'Campus Logistics', text: 'Hostel ticketing and mess.', icon: Building2 },
                { title: 'Leadership Board', text: 'Predictive analytics & revenue.', icon: Search },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors shadow-sm inner-glow">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Data (Notices & Events) */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Notices */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-orange-500/10 p-3 rounded-full text-orange-500">
                  <Megaphone className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold">Public Notice Board</h2>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)
                ) : notices.length > 0 ? (
                  notices.map((notice) => (
                    <div key={notice._id} className="p-5 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">{notice.category}</span>
                        <span className="text-xs text-muted-foreground">{new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{notice.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground">
                    No public notices available.
                  </div>
                )}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold">Upcoming Events</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading ? (
                  Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <div key={event._id} className="p-5 rounded-xl border border-border bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                      <div className="text-indigo-500 font-bold text-lg mb-1">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <h3 className="font-bold mb-2 leading-snug">{event.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-auto">
                        <Globe className="h-3 w-3" /> {event.venue}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground">
                    No upcoming events.
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center rounded-lg font-bold">U</div>
            <span className="font-semibold text-lg">UUMS Base OS</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Unified University Management System. Open Source Initiative.</p>
        </div>
      </footer>

    </div>
  );
}
