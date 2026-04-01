"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { BookOpen, Plus, X, Search, Pencil, Trash2, Save, Loader2, BookMarked, IndianRupee, ArrowUpDown, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

type Tab = "books" | "issues";

export default function LibraryManagePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("books");
  const [books, setBooks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Book form
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", category: "Computer Science", totalCopies: 1, shelfLocation: "", publisher: "", publishYear: 2024 });
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Issue form
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({ bookId: "", userId: "", dueDate: "" });
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [issueFilter, setIssueFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [booksRes, issuesRes, dashRes] = await Promise.all([
      fetch(`/api/library/books?q=${encodeURIComponent(search)}`),
      fetch(`/api/library/issues${issueFilter ? `?status=${issueFilter}` : ""}`),
      fetch("/api/library/dashboard"),
    ]);
    const booksData = await booksRes.json();
    const issuesData = await issuesRes.json();
    const dashData = await dashRes.json();
    if (booksData.success) setBooks(booksData.books);
    if (issuesData.success) setIssues(issuesData.issues);
    if (dashData.success) setStats(dashData.data.libraryStats);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search, issueFilter]);

  // User search for issuing books
  useEffect(() => {
    if (userSearch.length < 2) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(userSearch)}`);
      const data = await res.json();
      if (data.success) setUserResults(data.users);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  if (!user) return null;

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const url = editingBookId ? `/api/library/books/${editingBookId}` : "/api/library/books";
      const method = editingBookId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(bookForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowBookForm(false);
      setEditingBookId(null);
      setBookForm({ title: "", author: "", isbn: "", category: "Computer Science", totalCopies: 1, shelfLocation: "", publisher: "", publishYear: 2024 });
      fetchData();
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/library/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowIssueForm(false);
      setIssueForm({ bookId: "", userId: "", dueDate: "" });
      fetchData();
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleReturn = async (issueId: string) => {
    const fineStr = prompt("Enter fine amount (0 for no fine):", "0");
    if (fineStr === null) return;
    const fine = parseFloat(fineStr) || 0;
    await fetch(`/api/library/issues/${issueId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", fine }),
    });
    fetchData();
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/library/books/${id}`, { method: "DELETE" });
    fetchData();
  };

  const startEditBook = (book: any) => {
    setBookForm({ title: book.title, author: book.author, isbn: book.isbn, category: book.category, totalCopies: book.totalCopies, shelfLocation: book.shelfLocation, publisher: book.publisher || "", publishYear: book.publishYear || 2024 });
    setEditingBookId(book._id);
    setShowBookForm(true);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="h-8 w-8 text-primary" /> Library Management</h1>
        <p className="text-muted-foreground mt-1">Add books, issue to students, track returns and fines.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Copies" value={String(stats.totalBooks || 0)} icon={BookOpen} color="primary" />
        <StatCard title="Currently Issued" value={String(stats.booksIssued || 0)} icon={BookMarked} color="info" />
        <StatCard title="Overdue" value={String(stats.overdueBooks || 0)} icon={ArrowUpDown} color="destructive" />
        <StatCard title="Fines Collected" value={`₹${stats.finesCollected || 0}`} icon={IndianRupee} color="warning" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
        {(["books", "issues"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "books" ? "📚 Books Catalog" : "📋 Issued Books"}
          </button>
        ))}
      </div>

      {/* Books Tab */}
      {tab === "books" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Search books..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background  text-sm focus:ring-2 focus:ring-primary outline-none" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => { setShowBookForm(!showBookForm); setEditingBookId(null); setBookForm({ title: "", author: "", isbn: "", category: "Computer Science", totalCopies: 1, shelfLocation: "", publisher: "", publishYear: 2024 }); }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm shrink-0">
              {showBookForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Book</>}
            </button>
          </div>

          {showBookForm && (
            <Card className="mb-6 border-primary/20 animate-fade-in">
              <CardHeader><CardTitle>{editingBookId ? "Edit Book" : "Add New Book"}</CardTitle></CardHeader>
              <form onSubmit={handleBookSubmit} className="p-5 pt-0">
                {formError && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div><label className={labelClass}>Title *</label><input required className={inputClass} value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} /></div>
                  <div><label className={labelClass}>Author *</label><input required className={inputClass} value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} /></div>
                  <div><label className={labelClass}>ISBN *</label><input required className={inputClass} value={bookForm.isbn} onChange={e => setBookForm({...bookForm, isbn: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div><label className={labelClass}>Category *</label>
                    <select className={inputClass} value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})}>
                      <option>Computer Science</option><option>Mathematics</option><option>Physics</option><option>Electronics</option><option>Mechanical</option><option>Civil</option><option>General</option><option>Fiction</option><option>Reference</option>
                    </select>
                  </div>
                  <div><label className={labelClass}>Total Copies *</label><input type="number" min={1} required className={inputClass} value={bookForm.totalCopies} onChange={e => setBookForm({...bookForm, totalCopies: parseInt(e.target.value) || 1})} /></div>
                  <div><label className={labelClass}>Shelf Location *</label><input required className={inputClass} placeholder="e.g. A-3-15" value={bookForm.shelfLocation} onChange={e => setBookForm({...bookForm, shelfLocation: e.target.value})} /></div>
                  <div><label className={labelClass}>Publisher</label><input className={inputClass} value={bookForm.publisher} onChange={e => setBookForm({...bookForm, publisher: e.target.value})} /></div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
                    {submitting ? "Saving..." : editingBookId ? "Update Book" : "Add Book"}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
              ) : books.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No books found. Add some books to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-3 px-2 font-medium">Title</th>
                      <th className="py-3 px-2 font-medium">Author</th>
                      <th className="py-3 px-2 font-medium">Category</th>
                      <th className="py-3 px-2 font-medium">ISBN</th>
                      <th className="py-3 px-2 font-medium">Shelf</th>
                      <th className="py-3 px-2 font-medium">Copies</th>
                      <th className="py-3 px-2 font-medium">Available</th>
                      <th className="py-3 px-2 font-medium">Actions</th>
                    </tr></thead>
                    <tbody>
                      {books.map((book: any) => (
                        <tr key={book._id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 font-medium">{book.title}</td>
                          <td className="py-3 px-2 text-muted-foreground text-xs">{book.author}</td>
                          <td className="py-3 px-2"><span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{book.category}</span></td>
                          <td className="py-3 px-2 font-mono text-xs">{book.isbn}</td>
                          <td className="py-3 px-2 font-mono text-xs">{book.shelfLocation}</td>
                          <td className="py-3 px-2">{book.totalCopies}</td>
                          <td className="py-3 px-2"><span className={`font-semibold ${book.availableCopies > 0 ? "text-emerald-600" : "text-red-500"}`}>{book.availableCopies}</span></td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <button onClick={() => startEditBook(book)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => deleteBook(book._id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Issues Tab */}
      {tab === "issues" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" value={issueFilter} onChange={e => setIssueFilter(e.target.value)}>
              <option value="">All Status</option><option value="Active">Active</option><option value="Overdue">Overdue</option><option value="Returned">Returned</option>
            </select>
            <button onClick={() => setShowIssueForm(!showIssueForm)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm shrink-0">
              {showIssueForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Issue Book</>}
            </button>
          </div>

          {showIssueForm && (
            <Card className="mb-6 border-primary/20 animate-fade-in">
              <CardHeader><CardTitle>Issue a Book</CardTitle><CardDescription>Search user, select book, and set due date</CardDescription></CardHeader>
              <form onSubmit={handleIssueSubmit} className="p-5 pt-0">
                {formError && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>Book *</label>
                    <select required className={inputClass} value={issueForm.bookId} onChange={e => setIssueForm({...issueForm, bookId: e.target.value})}>
                      <option value="">Select a book</option>
                      {books.filter((b: any) => b.availableCopies > 0).map((b: any) => (
                        <option key={b._id} value={b._id}>{b.title} ({b.availableCopies} avail)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>User *</label>
                    <input className={inputClass} placeholder="Search user by name..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setIssueForm({...issueForm, userId: ""}); }} />
                    {userResults.length > 0 && !issueForm.userId && (
                      <div className="mt-1 border border-border rounded-lg divide-y max-h-32 overflow-y-auto">
                        {userResults.map((u: any) => (
                          <button key={u._id} type="button" onClick={() => { setIssueForm({...issueForm, userId: u._id}); setUserSearch(u.name); setUserResults([]); }} className="w-full text-left p-2 text-sm hover:bg-muted/50">
                            {u.name} <span className="text-muted-foreground">({u.role})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div><label className={labelClass}>Due Date *</label><input type="date" required className={inputClass} value={issueForm.dueDate} onChange={e => setIssueForm({...issueForm, dueDate: e.target.value})} /></div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={submitting || !issueForm.bookId || !issueForm.userId} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
                    {submitting ? "Issuing..." : "Issue Book"}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
              ) : issues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No issued books found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-3 px-2 font-medium">Book</th>
                      <th className="py-3 px-2 font-medium">User</th>
                      <th className="py-3 px-2 font-medium">Issued</th>
                      <th className="py-3 px-2 font-medium">Due</th>
                      <th className="py-3 px-2 font-medium">Status</th>
                      <th className="py-3 px-2 font-medium">Fine</th>
                      <th className="py-3 px-2 font-medium">Action</th>
                    </tr></thead>
                    <tbody>
                      {issues.map((issue: any) => (
                        <tr key={issue._id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 font-medium text-xs">{(issue.bookId as any)?.title || "Unknown"}</td>
                          <td className="py-3 px-2 text-xs">{(issue.userId as any)?.name || "Unknown"}<br/><span className="text-muted-foreground">{(issue.userId as any)?.role}</span></td>
                          <td className="py-3 px-2 text-xs">{new Date(issue.issuedAt).toLocaleDateString("en-IN")}</td>
                          <td className="py-3 px-2 text-xs">{new Date(issue.dueDate).toLocaleDateString("en-IN")}</td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                              issue.status === "Active" ? "bg-emerald-500/10 text-emerald-600" :
                              issue.status === "Overdue" ? "bg-red-500/10 text-red-500" :
                              "bg-muted text-muted-foreground"
                            }`}>{issue.status}</span>
                          </td>
                          <td className="py-3 px-2 font-medium">{issue.fine > 0 ? `₹${issue.fine}` : "—"}</td>
                          <td className="py-3 px-2">
                            {issue.status !== "Returned" && (
                              <button onClick={() => handleReturn(issue._id)} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium hover:bg-primary/20 transition-colors">
                                <RotateCcw className="h-3 w-3" /> Return
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
