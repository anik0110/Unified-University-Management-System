import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";

export const dynamic = "force-dynamic";

// GET: Single course details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const course = await Course.findById(id).populate("facultyId", "name email").lean();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error("Course GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update course
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, credits, type, program, semester, facultyId } = body;

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (credits !== undefined) update.credits = credits;
    if (type !== undefined) update.type = type;
    if (program !== undefined) update.program = program;
    if (semester !== undefined) update.semester = semester;
    if (facultyId !== undefined) update.facultyId = facultyId || null;

    await Course.findByIdAndUpdate(id, { $set: update });
    return NextResponse.json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    console.error("Course PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete course
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    await Course.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Course DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
