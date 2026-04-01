import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
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

// PUT: Edit a book
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkLibrarianAccess(session))) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const book = await Book.findById(id);
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const { title, author, category, totalCopies, shelfLocation, publisher, publishYear } = body;
    if (title) book.title = title;
    if (author) book.author = author;
    if (category) book.category = category;
    if (shelfLocation) book.shelfLocation = shelfLocation;
    if (publisher !== undefined) book.publisher = publisher;
    if (publishYear !== undefined) book.publishYear = publishYear;
    if (totalCopies !== undefined) {
      const diff = totalCopies - book.totalCopies;
      book.totalCopies = totalCopies;
      book.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    await book.save();
    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error("Book PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a book
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkLibrarianAccess(session))) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    await Book.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Book deleted" });
  } catch (error) {
    console.error("Book DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
