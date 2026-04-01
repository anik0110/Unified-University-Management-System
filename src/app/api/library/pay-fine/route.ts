import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { BookIssue } from "@/models/BookIssue";
import { Transaction } from "@/models/Transaction";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { issueId } = body;

    if (!issueId) {
      return NextResponse.json({ error: "issueId is required" }, { status: 400 });
    }

    const issue = await BookIssue.findById(issueId).populate("bookId", "title");
    if (!issue) return NextResponse.json({ error: "Book issue not found" }, { status: 404 });
    if (issue.userId.toString() !== session.userId) {
      return NextResponse.json({ error: "Unauthorized. This is not your book issue." }, { status: 401 });
    }
    if (issue.status !== "Overdue") {
      return NextResponse.json({ error: "Book is not overdue or already returned." }, { status: 400 });
    }

    // Recalculate fine against current settings
    const libSettings = await Setting.findOne({ key: "library" }).lean();
    const dailyFine = libSettings?.value?.dailyFine || 5;
    const now = new Date();
    
    let amountDue = 0;
    if (issue.dueDate < now) {
      const diffDays = Math.ceil((now.getTime() - new Date(issue.dueDate).getTime()) / (1000 * 3600 * 24));
      amountDue = diffDays * dailyFine;
    }

    if (amountDue <= 0) {
       return NextResponse.json({ error: "No fine due." }, { status: 400 });
    }

    // Fetch user wallet
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.walletBalance < amountDue) {
      return NextResponse.json({ 
        error: `Insufficient wallet balance. Required: ₹${amountDue}, Available: ₹${user.walletBalance}` 
      }, { status: 402 }); // Payment Required
    }

    // Find a Librarian to route the money to
    const librarian = await User.findOne({ $or: [{ role: "librarian" }, { extraRoles: "librarian" }] });

    // Deduct from User Wallet
    user.walletBalance -= amountDue;
    await user.save();

    // Route to Librarian Wallet 
    if (librarian) {
      librarian.walletBalance = (librarian.walletBalance || 0) + amountDue;
      await librarian.save();
    }

    // Create Transaction
    const transaction = await Transaction.create({
      userId: user._id,
      payeeId: librarian?._id,
      amount: amountDue,
      type: "Library",
      description: `Late Fine for book: ${(issue as any).bookId?.title || "Unknown Book"}`,
      status: "Success",
    });

    // Update Issue status to fine paid (but still needs to be returned)
    // Here we assume the student returns it and pays fine simultaneously, or just pays fine. 
    // Usually student pays fine off, but book is still in possession until returned physically.
    // For now, let's just mark the fine as paid in the DB and reset dueDate to today so fine restarts if not returned.
    issue.dueDate = new Date();
    issue.fine = 0;
    issue.status = "Active"; // It goes back to active, due today
    await issue.save();

    return NextResponse.json({ 
      success: true, 
      issue,
      transaction,
      walletBalance: user.walletBalance
    }, { status: 200 });

  } catch (error) {
    console.error("Library Pay Fine API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
