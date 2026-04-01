import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

// GET: List all courses
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean", "professor", "hod"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const courses = await Course.find()
      .populate("facultyId", "name email")
      .sort({ code: 1 })
      .lean();

    const formatted = courses.map((c: any) => ({
      _id: c._id,
      code: c.code,
      name: c.name,
      credits: c.credits,
      type: c.type,
      program: c.program,
      semester: c.semester,
      faculty: c.facultyId ? { _id: c.facultyId._id, name: c.facultyId.name } : null,
      enrolledCount: c.enrolledStudents?.length || 0,
    }));

    return NextResponse.json({ success: true, courses: formatted });
  } catch (error) {
    console.error("Courses GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new course
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { code, name, credits, type, program, semester, facultyId } = body;

    if (!code || !name || !credits || !program || !semester) {
      return NextResponse.json({ error: "Code, name, credits, program, and semester are required" }, { status: 400 });
    }

    const newCourse = await Course.create({
      code,
      name,
      credits,
      type: type || "Core",
      program,
      semester,
      facultyId: facultyId || undefined,
      enrolledStudents: [],
    });

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      course: { _id: newCourse._id, code, name },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Courses POST error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
