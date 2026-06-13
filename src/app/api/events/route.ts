import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Event } from "@/models/Event";

export const dynamic = "force-dynamic";

// GET: List events
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const events = await Event.find()
      .sort({ date: -1 })
      .limit(50)
      .populate("authorId", "name role")
      .lean();

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create event (faculty/admin only)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["super_admin", "director", "dean", "hod", "professor", "fest_coordinator"];
    if (!allowed.includes(session.role) && !(session.extraRoles || []).includes("fest_coordinator")) {
      return NextResponse.json({ error: "Not authorized to create events" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { title, description, date, venue, isPublic, organizer, festType, minTeamSize, maxTeamSize, capacity } = body;

    if (!title || !description || !date || !venue) {
      return NextResponse.json({ error: "Title, description, date, and venue are required" }, { status: 400 });
    }

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      venue,
      isPublic: isPublic !== false,
      organizer: organizer || session.role,
      authorId: session.userId,
      festType: festType || "General",
      minTeamSize: minTeamSize || 1,
      maxTeamSize: maxTeamSize || 1,
      capacity: capacity || 100,
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Events POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
