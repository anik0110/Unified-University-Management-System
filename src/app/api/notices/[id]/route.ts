import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Notice } from "@/models/Notice";

export const dynamic = "force-dynamic";

// PUT: Edit a notice (only author or admin)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const notice = await Notice.findById(id);
    if (!notice) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

    const isAdmin = ["super_admin", "director", "dean"].includes(session.role);
    if (notice.authorId.toString() !== session.userId && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to edit this notice" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, category, isPublic, audienceRoles } = body;
    if (title) notice.title = title;
    if (content) notice.content = content;
    if (category) notice.category = category;
    if (isPublic !== undefined) notice.isPublic = isPublic;
    if (audienceRoles !== undefined) notice.audienceRoles = audienceRoles;

    await notice.save();
    return NextResponse.json({ success: true, notice });
  } catch (error) {
    console.error("Notice PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a notice (only author or admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const notice = await Notice.findById(id);
    if (!notice) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

    const isAdmin = ["super_admin", "director", "dean"].includes(session.role);
    if (notice.authorId.toString() !== session.userId && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await Notice.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Notice deleted" });
  } catch (error) {
    console.error("Notice DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
