"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { Receipt, CreditCard, Banknote, CalendarClock, Download, AlertCircle, Wallet, IndianRupee, Loader2 } from "lucide-react";
import { generatePDFReceipt } from "@/lib/pdf-generator";

export default function StudentFees() {
  const { user, login } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingFee, setPayingFee] = useState<string | null>(null);

  const loadDashboard = () => {
    fetch("/api/student/dashboard")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch dashboard data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!user || user.role !== "student") return null;

  if (loading || !data) {
    return (
      <DashboardLayout> {/* Wrap loading state in layout for consistency */}
        <div className="flex items-center justify-center p-8 h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { feeDetails } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePayFee = async (type: string, amount: number) => {
    if (!confirm(`Pay ₹${amount} for ${type} Fee? This will be deducted from your wallet.`)) return;
    setPayingFee(type);
    try {
      const res = await fetch("/api/finance/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Fee paid successfully!");
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
            type: "Finance Fee",
            description: `${type} Fee ${resData.isLate ? "(Applied Late Fine)" : ""}`
          });
        }
      } else {
        alert(resData.error || "Failed to pay fee");
      }
    } catch (e) {
      alert("Error processing payment");
    } finally {
      setPayingFee(null);
    }
  };

  const progressPercentage = Math.round((feeDetails.paid / feeDetails.totalFee) * 100);

  const installmentColumns = [
    { key: "id", header: "Inst. No", className: "w-24 text-muted-foreground" },
    { key: "date", header: "Date" },
    { 
      key: "amount", 
      header: "Amount",
      className: "font-semibold",
      render: (val: number) => formatCurrency(val)
    },
    { key: "txnId", header: "Transaction ID", render: (val: string) => val ? <span className="font-mono text-xs">{val}</span> : "-" },
    { 
      key: "status", 
      header: "Status",
      render: (val: string) => <StatusBadge status={val} />
    },
    { key: "action", header: "", render: (row: any) => (
      row.status === "Paid" ? (
        <button onClick={() => alert("PDF downloaded in real flow via JS-PDF")} className="text-primary hover:text-primary/80 transition-colors" title="Download Receipt">
          <Download className="h-4 w-4" />
        </button>
      ) : (
        <button 
          onClick={() => handlePayFee(row.type, row.amount)}
          disabled={payingFee === row.type}
          className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-md font-medium hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
        >
          {payingFee === row.type ? <Loader2 className="h-3 w-3 animate-spin"/> : "Pay Now"}
        </button>
      )
    )},
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            Fee Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your financial obligations and payments.</p>
        </div>
        {feeDetails.pending > 0 && (
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm">
            Pay {formatCurrency(feeDetails.pending)}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard title="Total Fee" value={`₹${feeDetails.totalFee.toLocaleString()}`} icon={IndianRupee} color="info" />
        <StatCard title="Paid Amount" value={`₹${feeDetails.paid.toLocaleString()}`} icon={IndianRupee} color="success" />
        <StatCard 
          title="Pending Due" 
          value={`₹${feeDetails.pending.toLocaleString()}`} 
          subtitle={`Due Date: ${feeDetails.dueDate}`}
          icon={AlertCircle} 
          color={feeDetails.pending > 0 ? "warning" : "success"} 
        />
      </div>

      {/* Progress Bar */}
      <Card className="mb-8 overflow-hidden" padding="none">
        <div className="p-5 flex justify-between text-sm font-medium mb-2 border-b border-border">
          <span>Payment Progress</span>
          <span className="text-primary">{progressPercentage}% Paid</span>
        </div>
        <div className="p-5 pt-3">
          <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Fee Breakdown</CardTitle>
            <CardDescription>Detailed view of total fee</CardDescription>
          </CardHeader>
          <div className="p-5 pt-0 space-y-4">
            {feeDetails.breakdown.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.head}</span>
                <span className="font-medium">₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t border-border flex justify-between items-center font-bold">
              <span>Total</span>
              <span className="text-lg text-primary">₹{feeDetails.totalFee.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Installments & History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Installments & Payment History</CardTitle>
            <CardDescription>Track your past payments and upcoming dues</CardDescription>
          </CardHeader>
          <div className="p-1 px-5 pb-5">
            <DataTable 
              columns={[
                { key: "id", label: "Ins.", className: "font-mono text-xs w-16" },
                { key: "amount", label: "Amount", className: "font-medium", render: (row: any) => `₹${row.amount.toLocaleString()}` },
                { key: "status", label: "Status", render: (row: any) => <StatusBadge status={row.status} /> },
                { key: "date", label: "Date" },
                { key: "txnId", label: "Transaction ID", className: "font-mono text-xs text-muted-foreground", render: (row: any) => row.txnId || "-" },
                { key: "action", label: "", render: (row: any) => (
                  row.status === "Paid" ? (
                    <button onClick={() => alert("PDF downloaded in real flow via JS-PDF")} className="text-primary hover:text-primary/80 transition-colors" title="Download Receipt">
                      <Download className="h-4 w-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handlePayFee(row.type, row.amount)}
                      disabled={payingFee === row.type}
                      className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-md font-medium hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
                    >
                      {payingFee === row.type ? <Loader2 className="h-3 w-3 animate-spin"/> : "Pay Now"}
                    </button>
                  )
                )},
              ]}
              data={feeDetails.installments}
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
