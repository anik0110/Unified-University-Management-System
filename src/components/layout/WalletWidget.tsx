"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Wallet, Plus, Loader2 } from "lucide-react";
import clsx from "clsx";

interface WalletWidgetProps {
  collapsed?: boolean;
}

export function WalletWidget({ collapsed }: WalletWidgetProps) {
  const { user, login } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleAddFunds = async () => {
    const amount = Number(addAmount);
    if (!amount || amount <= 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success && user) {
        // Update local auth context with new balance
        login({ ...user, walletBalance: data.walletBalance });
        setIsAdding(false);
        setAddAmount("");
      } else {
        alert(data.error || "Failed to add funds");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while adding funds");
    } finally {
      setLoading(false);
    }
  };

  if (collapsed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 mb-2 mx-auto" title={`₹${user.walletBalance}`}>
        <Wallet className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="mx-3 mb-2 mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
          <Wallet className="h-4 w-4" />
          <span>My Wallet</span>
        </div>
        <div className="font-bold text-foreground">
          ₹{user.walletBalance?.toLocaleString() || 0}
        </div>
      </div>
      
      {isAdding ? (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="Amount"
            className="w-full min-w-0 rounded-lg border border-input bg-background px-2 py-1 text-sm outline-none focus:border-green-500"
            autoFocus
          />
          <button
            onClick={handleAddFunds}
            disabled={loading}
            className="flex shrink-0 items-center justify-center rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-1 rounded-lg bg-green-600/10 px-2 py-1.5 text-xs font-medium text-green-700 hover:bg-green-600/20 transition-colors mt-2"
        >
          <Plus className="h-3 w-3" /> Add Funds
        </button>
      )}
    </div>
  );
}
