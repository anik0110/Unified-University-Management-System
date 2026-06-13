import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";

export const dynamic = "force-dynamic";

// GET: Fetch events filtered by festType, with registration counts
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const festType = searchParams.get("festType");

    if (!festType || !["Technical", "Cultural"].includes(festType)) {
      return NextResponse.json({ error: "Valid festType query param required" }, { status: 400 });
    }

    const events = await Event.find({ festType })
      .sort({ date: 1 })
      .lean();

    // Get registration counts per event
    const eventIds = events.map((e: any) => e._id);
    const registrations = await EventRegistration.find({ eventId: { $in: eventIds } })
      .populate("leaderId", "name email")
      .populate("teamMembers", "name email")
      .lean();

    const eventsWithCounts = events.map((event: any) => {
      const eventRegs = registrations.filter(
        (r: any) => r.eventId.toString() === event._id.toString()
      );
      return {
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        date: new Date(event.date).toLocaleDateString(),
        rawDate: event.date,
        venue: event.venue,
        festType: event.festType,
        minTeamSize: event.minTeamSize || 1,
        maxTeamSize: event.maxTeamSize || 1,
        capacity: event.capacity || 100,
        registrationCount: eventRegs.length,
        registrations: eventRegs.map((r: any) => ({
          id: r._id.toString(),
          leaderId: r.leaderId?._id?.toString(),
          leaderName: r.leaderId?.name || "Unknown",
          leaderEmail: r.leaderId?.email || "",
          teamName: r.teamName,
          teamMembers: (r.teamMembers || []).map((m: any) => ({
            id: m._id?.toString(),
            name: m.name,
            email: m.email,
          })),
        })),
      };
    });

    return NextResponse.json({ success: true, events: eventsWithCounts });
  } catch (error) {
    console.error("Fest Events GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
