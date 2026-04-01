import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Notice } from "@/models/Notice";

export const dynamic = "force-dynamic";

// GET: List notices for current user's role
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const notices = await Notice.find({
      $or: [
        { audienceRoles: { $size: 0 } },
        { audienceRoles: session.role },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("authorId", "name role")
      .lean();

    return NextResponse.json({ success: true, notices });
  } catch (error) {
    console.error("Notices GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a notice (faculty/admin only)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["super_admin", "director", "dean", "hod", "professor"];
    if (!allowed.includes(session.role)) {
      return NextResponse.json({ error: "Only faculty and admin can post notices" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { title, content, category, isPublic, audienceRoles } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 });
    }

    const notice = await Notice.create({
      title,
      content,
      category,
      isPublic: isPublic || false,
      audienceRoles: audienceRoles || [],
      authorId: session.userId,
    });

    return NextResponse.json({ success: true, notice }, { status: 201 });
  } catch (error) {
    console.error("Notices POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
