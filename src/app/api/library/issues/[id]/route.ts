import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { BookIssue } from "@/models/BookIssue";
import { Book } from "@/models/Book";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

async function checkLibrarianAccess(session: any): Promise<boolean> {
  const allowed = ["librarian", "super_admin", "director"];
  if (allowed.includes(session.role)) return true;
  await connectDB();
  const user = await User.findById(session.userId, "extraRoles").lean();
  return !!(user as any)?.extraRoles?.includes("librarian");
}

// PUT: Return a book or update fine
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkLibrarianAccess(session))) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const issue = await BookIssue.findById(id);
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    const body = await req.json();
    const { action, fine } = body;

    if (action === "return") {
      if (issue.status === "Returned") {
        return NextResponse.json({ error: "Already returned" }, { status: 400 });
      }
      issue.status = "Returned";
      issue.returnedAt = new Date();
      if (fine !== undefined) issue.fine = fine;

      // Increment available copies
      await Book.findByIdAndUpdate(issue.bookId, { $inc: { availableCopies: 1 } });
    } else if (fine !== undefined) {
      issue.fine = fine;
    }

    await issue.save();
    return NextResponse.json({ success: true, issue });
  } catch (error) {
    console.error("Issue PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
