"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, statusColumn } from "@/components/ui/DataTable";
import { Wallet, IndianRupee, PieChart as PieChartIcon, TrendingUp, Download, Receipt, Settings } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function FinanceDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Accountant Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [tuitionFee, setTuitionFee] = useState(50000);
  const [residenceFee, setResidenceFee] = useState(20000);
  const [lateFine, setLateFine] = useState(1000);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadDashboard = () => {
    fetch("/api/finance/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
          if (json.data.settings) {
            setTuitionFee(json.data.settings.tuitionFee || 50000);
            setResidenceFee(json.data.settings.residenceFee || 20000);
            setLateFine(json.data.settings.lateFine || 1000);
            
            // Format date for inputs
            try {
              const d = new Date(json.data.settings.dueDate);
              if (!isNaN(d.getTime())) setDueDate(d.toISOString().split("T")[0]);
            } catch (e) {}
          }
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!user || user.role === "student" || user.role === "professor" || user.role === "hostel_warden") return null;

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings/finance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tuitionFee, residenceFee, lateFine, dueDate })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Finance settings saved successfully!");
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

  const { collectionStats, recentTransactions } = data;

  const chartColor = theme === "dark" ? "#818cf8" : "#6366f1";
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            Finance & Collections
          </h1>
          <p className="text-muted-foreground mt-1">Real-time overview of university revenue and fee collections.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium border border-border transition-colors shadow-sm"
          >
            <Settings className="h-4 w-4" />
            Configure Fees
          </button>
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl font-medium transition-colors border border-border shadow-sm">
            <Download className="h-4 w-4" />
            Export Ledger
          </button>
        </div>
      </div>

      {showSettings && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Global Fee Configuration</CardTitle>
            <CardDescription>Set the generic fee amounts for students based on transaction flows.</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px] space-y-2 text-sm">
              <label className="font-medium">Tuition Fee (₹):</label>
              <input type="number" value={tuitionFee} onChange={e => setTuitionFee(Number(e.target.value))} className="w-full rounded-md border p-2 bg-background" />
            </div>
            <div className="flex-1 min-w-[150px] space-y-2 text-sm">
              <label className="font-medium">Residence Fee (₹):</label>
              <input type="number" value={residenceFee} onChange={e => setResidenceFee(Number(e.target.value))} className="w-full rounded-md border p-2 bg-background" />
            </div>
            <div className="flex-1 min-w-[150px] space-y-2 text-sm">
              <label className="font-medium">Late Fine (₹):</label>
              <input type="number" value={lateFine} onChange={e => setLateFine(Number(e.target.value))} className="w-full rounded-md border p-2 bg-background" />
            </div>
            <div className="flex-1 min-w-[150px] space-y-2 text-sm">
              <label className="font-medium">Due Date:</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-md border p-2 bg-background" />
            </div>
            <button onClick={handleSaveSettings} disabled={savingSettings} className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary/90 w-full sm:w-auto mt-2 sm:mt-0">
              {savingSettings ? "Saving..." : "Save Config"}
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
        <StatCard title="Total Collected" value={`₹${(collectionStats.totalCollected / 10000000).toFixed(2)} Cr`} subtitle="Current Academic Year" icon={IndianRupee} color="success" />
        <StatCard title="Pending Dues" value={`₹${(collectionStats.pending / 100000).toFixed(2)} L`} subtitle="To be collected" icon={Wallet} color="warning" />
        <StatCard title="Defaulters" value={collectionStats.defaulters} subtitle="Overdue by 30+ days" icon={TrendingUp} color="destructive" />
        <StatCard title="Total Expected" value={`₹${(collectionStats.totalExpected / 10000000).toFixed(2)} Cr`} subtitle="Annual projection" icon={PieChartIcon} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Collection Trend */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Collection Trend</CardTitle>
            <CardDescription>Monthly revenue flow (in Millions)</CardDescription>
          </CardHeader>
          <div className="flex-1 p-5 pt-0 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionStats.monthlyCollection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="month" stroke={gridColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke={gridColor} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `₹${val/1000000}M`}
                />
                <Tooltip 
                  formatter={(value: any) => [`₹${(Number(value)/100000).toFixed(2)} Lakhs`, 'Collected']}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="collected" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Program-wise Distribution */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Program Revenue</CardTitle>
            <CardDescription>Collection by department</CardDescription>
          </CardHeader>
          <div className="flex-1 p-5 pt-0 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collectionStats.programWise}
                  dataKey="collected"
                  nameKey="program"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                >
                  {collectionStats.programWise.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={[
                      theme === 'dark' ? '#818cf8' : '#6366f1', 
                      '#10b981', '#f59e0b', '#ec4899'
                    ][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`₹${(Number(value)/100000).toFixed(2)} L`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest fee payments from gateway</CardDescription>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Receipt className="h-5 w-5" />
          </div>
        </CardHeader>
        <div className="p-1 px-5 pb-5 pt-4">
          <DataTable 
            columns={[
              { key: "id", label: "Txn ID", className: "font-mono font-medium text-xs text-muted-foreground w-24" },
              { key: "student", label: "Student", className: "font-medium" },
              { key: "program", label: "Program" },
              { key: "method", label: "Method" },
              { key: "amount", label: "Amount", className: "font-medium", render: (row: any) => `₹${row.amount.toLocaleString()}` },
              { key: "date", label: "Date" },
              statusColumn("status", "Status"),
              { key: "action", label: "", render: (row: any) => (
                row.status === "Success" && (
                  <button className="text-primary hover:text-primary/80 transition-colors" title="Download Receipt">
                    <Download className="h-4 w-4" />
                  </button>
                )
              )},
            ]}
            data={recentTransactions}
          />
        </div>
      </Card>
    </DashboardLayout>
  );
}
