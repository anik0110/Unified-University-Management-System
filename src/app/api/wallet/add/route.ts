import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";

export const dynamic = "force-dynamic";

// POST: Add funds to wallet (Simulated)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { amount } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Update user balance
    const user = await User.findByIdAndUpdate(
      session.userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log transaction
    const transaction = await Transaction.create({
      userId: user._id,
      amount,
      type: "Wallet Deposit",
      description: `Added ₹${amount} to wallet`,
      status: "Success",
    });

    return NextResponse.json({ 
      success: true, 
      walletBalance: user.walletBalance,
      transaction 
    }, { status: 200 });

  } catch (error) {
    console.error("Wallet Add API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
