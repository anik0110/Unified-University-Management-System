import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Event } from "@/models/Event";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    // Fetch only future public events 
    const now = new Date();
    const events = await Event.find({ isPublic: true, date: { $gte: now } })
      .sort({ date: 1 }) // Upcoming first
      .limit(4)
      .lean();

    return NextResponse.json({ success: true, events }, { status: 200 });
  } catch (error) {
    console.error("Public Events API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
