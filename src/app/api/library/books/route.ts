import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Book } from "@/models/Book";

export const dynamic = "force-dynamic";

// GET: Search / list books
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const filter: any = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { isbn: { $regex: q, $options: "i" } },
      ];
    }

    const books = await Book.find(filter).sort({ title: 1 }).limit(100).lean();
    return NextResponse.json({ success: true, books });
  } catch (error) {
    console.error("Books GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Add a book (librarian/admin only)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["librarian", "super_admin", "director"];
    const hasAccess = allowed.includes(session.role) || (session as any).extraRoles?.includes("librarian");
    if (!hasAccess) {
      // Check from DB
      await connectDB();
      const { User } = await import("@/models/User");
      const user = await User.findById(session.userId, "extraRoles").lean();
      if (!user || (!allowed.includes(session.role) && !(user as any).extraRoles?.includes("librarian"))) {
        return NextResponse.json({ error: "Only librarians can manage books" }, { status: 403 });
      }
    }

    await connectDB();
    const body = await req.json();
    const { title, author, isbn, category, totalCopies, shelfLocation, publisher, publishYear } = body;

    if (!title || !author || !isbn || !category || !shelfLocation) {
      return NextResponse.json({ error: "Title, author, ISBN, category, and shelf location are required" }, { status: 400 });
    }

    const book = await Book.create({
      title, author, isbn, category,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      shelfLocation,
      publisher, publishYear,
    });

    return NextResponse.json({ success: true, book }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "A book with this ISBN already exists" }, { status: 409 });
    }
    console.error("Books POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
