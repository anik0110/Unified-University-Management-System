import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Notice } from "@/models/Notice";

// We want this endpoint to be dynamically evaluated to always serve fresh public notices
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    // Fetch only notices marked as public, sorting by newest first
    const notices = await Notice.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("authorId", "name role") // Optional: to show who posted it
      .lean();

    return NextResponse.json({ success: true, notices }, { status: 200 });
  } catch (error) {
    console.error("Public Notices API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
