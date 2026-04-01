import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Setting } from "@/models/Setting";
import { Student } from "@/models/Student";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { type } = body;

    if (!type || !["Tuition", "Residence"].includes(type)) {
      return NextResponse.json({ error: "Valid payment type (Tuition or Residence) is required" }, { status: 400 });
    }

    // Get pricing config
    const finSettings = await Setting.findOne({ key: "finance" }).lean();
    const prices = finSettings?.value || { tuitionFee: 50000, residenceFee: 20000, lateFine: 1000, dueDate: new Date() };
    
    let baseAmount = type === "Tuition" ? prices.tuitionFee : prices.residenceFee;
    
    // Check if late fine applies
    const now = new Date();
    const isLate = now > new Date(prices.dueDate);
    const amountDue = isLate ? baseAmount + prices.lateFine : baseAmount;

    // Fetch user wallet
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure student hasn't already paid (Check transactions)
    // We assume fees are paid once per semester/setup for simplicity.
    const alreadyPaid = await Transaction.findOne({ userId: session.userId, type: type, status: "Success" });
    if (alreadyPaid) {
      return NextResponse.json({ error: `You have already paid your ${type} fees.` }, { status: 400 });
    }

    if (user.walletBalance < amountDue) {
      return NextResponse.json({ 
        error: `Insufficient wallet balance. Required: ₹${amountDue}, Available: ₹${user.walletBalance}` 
      }, { status: 402 }); // Payment Required
    }

    // Find an Accountant to route the money to
    const accountant = await User.findOne({ $or: [{ role: "accountant" }, { extraRoles: "accountant" }] });

    // Deduct from User Wallet
    user.walletBalance -= amountDue;
    await user.save();

    // Route to Accountant Wallet
    if (accountant) {
      accountant.walletBalance = (accountant.walletBalance || 0) + amountDue;
      await accountant.save();
    }

    // Create Transaction
    const transaction = await Transaction.create({
      userId: user._id,
      payeeId: accountant?._id,
      amount: amountDue,
      type: type,
      description: `Payment for ${type} Fees ${isLate ? "(Includes Late Fine)" : ""}`,
      status: "Success",
    });

    // Option: Sync with Student model if needed (like setting a 'feesPaid' true boolean) 
    // Here we will just rely on the Transaction existing.

    return NextResponse.json({ 
      success: true, 
      transaction,
      walletBalance: user.walletBalance,
      isLate
    }, { status: 201 });

  } catch (error) {
    console.error("Finance Pay API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
