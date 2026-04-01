import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Event } from "@/models/Event";

export const dynamic = "force-dynamic";

// PUT: Edit event
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const isAdmin = ["super_admin", "director", "dean"].includes(session.role);
    if (event.authorId.toString() !== session.userId && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    Object.assign(event, body);
    if (body.date) event.date = new Date(body.date);
    await event.save();
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Event PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete event
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const isAdmin = ["super_admin", "director", "dean"].includes(session.role);
    if (event.authorId.toString() !== session.userId && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await Event.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Event DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
