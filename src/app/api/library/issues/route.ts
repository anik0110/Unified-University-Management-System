import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { BookIssue } from "@/models/BookIssue";
import { Book } from "@/models/Book";
import { User } from "@/models/User";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

async function checkLibrarianAccess(session: any): Promise<boolean> {
  const allowed = ["librarian", "super_admin", "director"];
  if (allowed.includes(session.role)) return true;
  await connectDB();
  const user = await User.findById(session.userId, "extraRoles").lean();
  return !!(user as any)?.extraRoles?.includes("librarian");
}

// GET: List issued books (all or for current user)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "";
    const forUser = searchParams.get("userId") || "";

    const filter: any = {};
    if (statusFilter) filter.status = statusFilter;
    
    const isLibrarian = await checkLibrarianAccess(session);
    if (!isLibrarian) {
      // Non-librarians can only see their own issues
      filter.userId = session.userId;
    } else if (forUser) {
      filter.userId = forUser;
    }

    // Auto-update overdue statuses
    await BookIssue.updateMany(
      { status: "Active", dueDate: { $lt: new Date() } },
      { $set: { status: "Overdue" } }
    );

    const issuesData = await BookIssue.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("bookId", "title author isbn")
      .populate("userId", "name email role")
      .lean();

    // Fetch dynamic fine settings
    const libSettings = await Setting.findOne({ key: "library" }).lean();
    const dailyFine = libSettings?.value?.dailyFine || 5;

    // Calculate real-time fines for Overdue books
    const now = new Date();
    const issues = issuesData.map((issue: any) => {
      let calculatedFine = issue.fine || 0;
      if (issue.status === "Overdue" && issue.dueDate < now) {
        const diffDays = Math.ceil((now.getTime() - new Date(issue.dueDate).getTime()) / (1000 * 3600 * 24));
        if (diffDays > 0) {
          calculatedFine = diffDays * dailyFine;
        }
      }
      return { ...issue, fine: calculatedFine };
    });

    return NextResponse.json({ success: true, issues });
  } catch (error) {
    console.error("Issues GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Issue a book to a user (librarian only)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkLibrarianAccess(session))) {
      return NextResponse.json({ error: "Only librarians can issue books" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { bookId, userId, dueDate } = body;

    if (!bookId || !userId || !dueDate) {
      return NextResponse.json({ error: "bookId, userId, and dueDate are required" }, { status: 400 });
    }

    // Check book availability
    const book = await Book.findById(bookId);
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    if (book.availableCopies <= 0) {
      return NextResponse.json({ error: "No copies available" }, { status: 400 });
    }

    // Check user exists
    const userExists = await User.findById(userId);
    if (!userExists) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Create issue and decrement available copies
    const issue = await BookIssue.create({
      bookId,
      userId,
      dueDate: new Date(dueDate),
    });

    book.availableCopies -= 1;
    await book.save();

    return NextResponse.json({ success: true, issue }, { status: 201 });
  } catch (error) {
    console.error("Issues POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
