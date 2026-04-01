import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Setting } from "@/models/Setting";
import { Transaction } from "@/models/Transaction";
import { FestRegistration } from "@/models/FestRegistration";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { festType } = body;

    if (!festType || !["Technical", "Cultural"].includes(festType)) {
      return NextResponse.json({ error: "Valid festType (Technical or Cultural) is required" }, { status: 400 });
    }

    // Check if already registered
    const existingReg = await FestRegistration.findOne({ userId: session.userId, festType });
    if (existingReg) {
      return NextResponse.json({ error: `Already registered for ${festType} fest` }, { status: 400 });
    }

    // Get pricing config
    const festSettings = await Setting.findOne({ key: "fest" });
    const prices = festSettings?.value || { technicalFee: 500, culturalFee: 500 };
    const amountDue = festType === "Technical" ? prices.technicalFee : prices.culturalFee;

    // Fetch user wallet
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.walletBalance < amountDue) {
      return NextResponse.json({ 
        error: `Insufficient wallet balance. Required: ₹${amountDue}, Available: ₹${user.walletBalance}` 
      }, { status: 402 }); // Payment Required
    }

    // Find a Fest Coordinator to route the money to (first available or system admin if none)
    const coordinator = await User.findOne({ $or: [{ role: "fest_coordinator" }, { extraRoles: "fest_coordinator" }] });

    // Deduct from User Wallet
    user.walletBalance -= amountDue;
    await user.save();

    // Route to Coordinator Wallet (Optional depending on business logic, but tracking transaction is required)
    if (coordinator) {
      coordinator.walletBalance = (coordinator.walletBalance || 0) + amountDue;
      await coordinator.save();
    }

    // Create Transaction
    const transaction = await Transaction.create({
      userId: user._id,
      payeeId: coordinator?._id,
      amount: amountDue,
      type: "Fest",
      description: `Registration for ${festType} Fest`,
      status: "Success",
    });

    // Create Registration Ticket
    const registration = await FestRegistration.create({
      userId: user._id,
      festType,
      transactionId: transaction._id,
    });

    return NextResponse.json({ 
      success: true, 
      registration,
      transaction,
      walletBalance: user.walletBalance
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Already registered for this fest" }, { status: 400 });
    }
    console.error("Fest Register API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
