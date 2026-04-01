import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Book } from "@/models/Book";
import { BookIssue } from "@/models/BookIssue";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Auto-update overdue
    await BookIssue.updateMany(
      { status: "Active", dueDate: { $lt: new Date() } },
      { $set: { status: "Overdue" } }
    );

    // Real stats
    const totalBooks = await Book.countDocuments();
    const totalCopies = await Book.aggregate([{ $group: { _id: null, total: { $sum: "$totalCopies" } } }]);
    const booksIssued = await BookIssue.countDocuments({ status: { $in: ["Active", "Overdue"] } });
    const overdueBooks = await BookIssue.countDocuments({ status: "Overdue" });
    const finesAgg = await BookIssue.aggregate([{ $group: { _id: null, total: { $sum: "$fine" } } }]);
    const finesCollected = finesAgg[0]?.total || 0;

    // Books catalog
    const books = await Book.find()
      .sort({ title: 1 })
      .limit(50)
      .lean()
      .then((bks: any[]) => bks.map(b => ({
        _id: b._id,
        title: b.title,
        author: b.author,
        category: b.category,
        location: b.shelfLocation,
        isbn: b.isbn,
        total: b.totalCopies,
        available: b.availableCopies,
      })));

    // Fetch dynamic fine settings
    const libSettingsDoc = await Setting.findOne({ key: "library" }).lean();
    const libSettings = libSettingsDoc?.value || { maxIssueDays: 14, dailyFine: 5 };
    const now = new Date();

    // Borrowed books - for students show only theirs, otherwise show recent
    const issueFilter: any = { status: { $ne: "Returned" } };
    if (session.role === "student") {
      issueFilter.userId = session.userId;
    }
    const borrowedBooksData = await BookIssue.find(issueFilter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("bookId", "title author")
      .populate("userId", "name")
      .lean();

    const borrowedBooks = borrowedBooksData.map((i: any) => {
      let calculatedFine = i.fine || 0;
      if (i.status === "Overdue" && i.dueDate < now) {
        const diffDays = Math.ceil((now.getTime() - new Date(i.dueDate).getTime()) / (1000 * 3600 * 24));
        if (diffDays > 0) {
          calculatedFine = diffDays * libSettings.dailyFine;
        }
      }
      return {
        _id: i._id.toString(),
        bookTitle: (i.bookId as any)?.title || "Unknown",
        student: (i.userId as any)?.name || "Unknown",
        dueDateOrig: i.dueDate, // needed for comparison
        dueDate: new Date(i.dueDate).toLocaleDateString("en-IN"),
        status: i.status,
        fine: calculatedFine,
      };
    });

    const libraryStats = {
      totalBooks: totalCopies[0]?.total || totalBooks,
      booksIssued,
      overdueBooks,
      finesCollected,
    };

    return NextResponse.json({
      success: true,
      data: { books, borrowedBooks, libraryStats, resourceBookings: [], settings: libSettings },
    });
  } catch (error) {
    console.error("Library Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
