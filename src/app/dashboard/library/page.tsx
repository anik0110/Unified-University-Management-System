"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, statusColumn } from "@/components/ui/DataTable";
import { BookOpen, Search, BookMarked, IndianRupee, Laptop, Settings, Loader2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { generatePDFReceipt } from "@/lib/pdf-generator";

export default function LibraryPage() {
  const { user, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Librarian Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [maxIssueDays, setMaxIssueDays] = useState(14);
  const [dailyFine, setDailyFine] = useState(5);
  const [savingSettings, setSavingSettings] = useState(false);

  const [payingFine, setPayingFine] = useState<string | null>(null);

  const loadDashboard = () => {
    fetch("/api/library/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
          setMaxIssueDays(json.data.settings?.maxIssueDays || 14);
          setDailyFine(json.data.settings?.dailyFine || 5);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!user || ["accountant", "hostel_warden", "chief_warden", "hostel_supervisor"].includes(user.role)) return null;

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
      const res = await fetch("/api/settings/library", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxIssueDays, dailyFine })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Library settings saved!");
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

  const handlePayFine = async (issueId: string, amount: number, bookTitle: string) => {
    if (!confirm(`Pay fine of ₹${amount} for '${bookTitle}'? This will be deducted from your wallet.`)) return;
    setPayingFine(issueId);
    try {
      const res = await fetch("/api/library/pay-fine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Fine paid successfully!");
        if (user) login({ ...user, walletBalance: resData.walletBalance });
        loadDashboard();

        // Generate PDF
        if (user) {
          generatePDFReceipt({
            transactionId: resData.transaction._id,
            date: new Date().toLocaleDateString(),
            name: user.name,
            email: user.email,
            amount: resData.transaction.amount,
            type: "Library Fine",
            description: `Late submission fine for book: ${bookTitle}`
          });
        }
      } else {
        alert(resData.error || "Failed to pay fine");
      }
    } catch (e) {
      alert("Error processing payment");
    } finally {
      setPayingFine(null);
    }
  };

  const { books, borrowedBooks, libraryStats } = data;

  const isStudent = user.role === "student";
  
  const filteredBooks = books.filter((b: any) => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLibrarian = user.role === "librarian" || user.role === "super_admin";

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Library & Resources
          </h1>
          <p className="text-muted-foreground mt-1">OPAC book search, digital repository, and resource bookings.</p>
        </div>
        {isLibrarian && (
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium border border-border transition-colors shadow-sm"
          >
            <Settings className="h-4 w-4" />
            Library Rules
          </button>
        )}
      </div>

      {showSettings && isLibrarian && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Library Fine Configuration</CardTitle>
            <CardDescription>Configure borrowing limits and overdue fines.</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 text-sm max-w-xs">
              <label className="font-medium">Max Issue Days:</label>
              <input type="number" value={maxIssueDays} onChange={e => setMaxIssueDays(Number(e.target.value))} className="w-full rounded-md border p-2" />
            </div>
            <div className="flex-1 space-y-2 text-sm max-w-xs">
              <label className="font-medium">Daily Fine (₹):</label>
              <input type="number" value={dailyFine} onChange={e => setDailyFine(Number(e.target.value))} className="w-full rounded-md border p-2" />
            </div>
            <button onClick={handleSaveSettings} disabled={savingSettings} className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary/90">
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </Card>
      )}

      {isStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Books Issued" value={borrowedBooks.filter((b: any) => b.status !== "Returned").length} icon={BookMarked} color="primary" />
          <StatCard title="Overdue Books" value={borrowedBooks.filter((b: any) => b.status === "Overdue").length} icon={BookOpen} color="destructive" />
          <StatCard title="Pending Fines" value={`₹${borrowedBooks.reduce((sum: number, b: any) => sum + (b.fine || 0), 0)}`} icon={IndianRupee} color="warning" />
          <StatCard title="Resource Bookings" value="0" icon={Laptop} color="info" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <StatCard title="Total Books" value={libraryStats.totalBooks.toLocaleString()} icon={BookOpen} color="primary" />
          <StatCard title="Active Issued" value={libraryStats.booksIssued} icon={BookMarked} color="success" />
          <StatCard title="Overdue Returns" value={libraryStats.overdueBooks} icon={BookOpen} color="destructive" />
          <StatCard title="Fines Collected" value={`₹${libraryStats.finesCollected}`} icon={IndianRupee} color="info" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OPAC Search */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>OPAC Catalog Search</CardTitle>
              <CardDescription>Find and reserve books</CardDescription>
            </div>
          </CardHeader>
          <div className="px-5 pb-5">
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, author, or category (e.g., Computer Science)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            
            <DataTable 
              columns={[
                { key: "title", label: "Book Title", className: "font-medium" },
                { key: "author", label: "Author", className: "text-xs text-muted-foreground" },
                { key: "category", label: "Category", className: "hidden md:table-cell" },
                { key: "location", label: "Shelf", className: "font-mono text-xs hidden sm:table-cell" },
                { key: "available", label: "Status", render: (row: any) => (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${row.available > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                    {row.available > 0 ? `${row.available} Available` : "Checked Out"}
                  </span>
                )},
                { key: "action", label: "", render: (row: any) => (
                  <button 
                    disabled={row.available === 0}
                    className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reserve
                  </button>
                )},
              ]}
              data={filteredBooks.slice(0, 5)}
            />
          </div>
        </Card>

        {/* Issued Books / History */}
        <Card>
          <CardHeader>
            <CardTitle>{isStudent ? "My Issued Books" : "Recent Issues"}</CardTitle>
            <CardDescription>Track borrowing history</CardDescription>
          </CardHeader>
          <div className="p-1 px-5 pb-5 pt-0">
            <DataTable 
              columns={[
                { key: "bookTitle", label: "Title", className: "font-medium text-xs leading-snug" },
                { key: "dueDate", label: "Due", className: "text-xs tabular-nums" },
                statusColumn("status", "Status"),
                { key: "fine", label: "Fine", render: (row: any) => (
                  <div>
                    {row.fine > 0 ? <span className="text-red-500 font-bold text-xs">₹{row.fine}</span> : <span className="text-xs text-muted-foreground">-</span>}
                  </div>
                )},
                { key: "action", label: "", render: (row: any) => (
                  row.fine > 0 && isStudent ? (
                    <button 
                      onClick={() => handlePayFine(row._id, row.fine, row.bookTitle)}
                      disabled={payingFine === row._id}
                      className="text-xs bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                    >
                      {payingFine === row._id ? <Loader2 className="h-3 w-3 animate-spin"/> : "Pay"}
                    </button>
                  ) : null
                )},
              ]}
              data={borrowedBooks}
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
