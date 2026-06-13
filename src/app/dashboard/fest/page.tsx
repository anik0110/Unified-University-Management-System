"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PartyPopper, Cpu, Palette, CalendarDays, IndianRupee, Users, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function FestSelectionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fest/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const { festStats, userFestPasses } = data;
  const techFest = festStats.revenueByFest?.find((f: any) => f.fest === "Technical Fest") || {};
  const cultFest = festStats.revenueByFest?.find((f: any) => f.fest === "Cultural Fest") || {};

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <PartyPopper className="h-8 w-8 text-primary" />
          Fest Management
        </h1>
        <p className="text-muted-foreground mt-1">Select a fest to manage events, registrations, and analytics.</p>
      </div>

      {/* Overview Stats (Coordinator only) */}
      {isCoordinator && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
          <StatCard title="Active Fests" value={festStats.totalFests} icon={CalendarDays} color="primary" />
          <StatCard title="Total Events" value={festStats.totalEvents} icon={PartyPopper} color="info" />
          <StatCard title="Total Registrations" value={festStats.totalRegistrations} subtitle="Fest passes sold" icon={Users} color="success" />
          <StatCard title="Revenue Collected" value={`₹${(festStats.totalRevenue / 1000).toFixed(1)}k`} icon={IndianRupee} color="warning" />
        </div>
      )}

      {/* Fest Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Fest */}
        <Link href="/dashboard/fest/technical">
          <Card hover className="group cursor-pointer border-transparent hover:border-blue-500/30 shadow-md hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Cpu className="h-7 w-7" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-xl mt-4">Technical Fest</CardTitle>
              <CardDescription>Hackathons, coding challenges, robotics, and more.</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 relative z-10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-foreground">{techFest.events || 0}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-foreground">{techFest.registrations || 0}</p>
                  <p className="text-xs text-muted-foreground">Passes</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-foreground">{techFest.eventRegistrations || 0}</p>
                  <p className="text-xs text-muted-foreground">Entries</p>
                </div>
              </div>
              {isStudent && (
                <div className={`mt-4 text-center text-sm font-medium rounded-xl py-2.5 ${
                  userFestPasses?.Technical 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                }`}>
                  {userFestPasses?.Technical ? "✓ Fest Pass Purchased" : "Register for ₹" + (festStats.prices?.technicalFee || 500)}
                </div>
              )}
              {isCoordinator && (
                <div className="mt-4 text-center text-sm font-medium rounded-xl py-2.5 bg-muted text-muted-foreground">
                  Fee: ₹{festStats.prices?.technicalFee || 500} · Revenue: ₹{((techFest.revenue || 0) / 1000).toFixed(1)}k
                </div>
              )}
            </div>
          </Card>
        </Link>

        {/* Cultural Fest */}
        <Link href="/dashboard/fest/cultural">
          <Card hover className="group cursor-pointer border-transparent hover:border-pink-500/30 shadow-md hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-500/10 transition-colors" />
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Palette className="h-7 w-7" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-xl mt-4">Cultural Fest</CardTitle>
              <CardDescription>Dance, music, drama, art exhibitions, and more.</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 relative z-10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-foreground">{cultFest.events || 0}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-foreground">{cultFest.registrations || 0}</p>
                  <p className="text-xs text-muted-foreground">Passes</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-foreground">{cultFest.eventRegistrations || 0}</p>
                  <p className="text-xs text-muted-foreground">Entries</p>
                </div>
              </div>
              {isStudent && (
                <div className={`mt-4 text-center text-sm font-medium rounded-xl py-2.5 ${
                  userFestPasses?.Cultural 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                    : "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20"
                }`}>
                  {userFestPasses?.Cultural ? "✓ Fest Pass Purchased" : "Register for ₹" + (festStats.prices?.culturalFee || 500)}
                </div>
              )}
              {isCoordinator && (
                <div className="mt-4 text-center text-sm font-medium rounded-xl py-2.5 bg-muted text-muted-foreground">
                  Fee: ₹{festStats.prices?.culturalFee || 500} · Revenue: ₹{((cultFest.revenue || 0) / 1000).toFixed(1)}k
                </div>
              )}
            </div>
          </Card>
        </Link>
      </div>
    </DashboardLayout>
  );
}
