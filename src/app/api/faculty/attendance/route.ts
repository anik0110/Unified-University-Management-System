import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { Attendance } from "@/models/Attendance";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

// GET: View attendance records for a specific course
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["professor", "hod", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify this faculty is assigned to the course
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const records = await Attendance.find({ courseId })
      .sort({ date: -1 })
      .lean();

    // Get enrolled student names
    const studentIds = (course as any).enrolledStudents || [];
    const students = await User.find({ _id: { $in: studentIds } }, "name email").lean();

    return NextResponse.json({
      success: true,
      course: { _id: (course as any)._id, code: (course as any).code, name: (course as any).name },
      students,
      records: records.map((r: any) => ({
        _id: r._id,
        date: r.date,
        records: r.records,
      })),
    });
  } catch (error) {
    console.error("Faculty Attendance GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit attendance for a class session
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["professor", "hod", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { courseId, date, records } = body;

    if (!courseId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "courseId, date, and records are required" }, { status: 400 });
    }

    // Normalize date to midnight
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check for existing attendance on same date for same course
    const existing = await Attendance.findOne({
      courseId,
      date: attendanceDate,
    });

    if (existing) {
      // Update existing records
      existing.records = records;
      await existing.save();
      return NextResponse.json({ success: true, message: "Attendance updated successfully" });
    }

    // Create new attendance record
    await Attendance.create({
      courseId,
      facultyId: session.userId,
      date: attendanceDate,
      records,
    });

    return NextResponse.json({ success: true, message: "Attendance submitted successfully" }, { status: 201 });
  } catch (error) {
    console.error("Faculty Attendance POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
