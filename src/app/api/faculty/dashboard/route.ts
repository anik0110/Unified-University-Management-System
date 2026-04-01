import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Faculty } from "@/models/Faculty";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Attendance } from "@/models/Attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId || !["professor", "hod", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const facultyProfile = await Faculty.findOne({ userId: session.userId });

    // Get courses assigned to this faculty
    const courses = await Course.find({ facultyId: session.userId }).lean();
    
    // Compute total enrolled students across all courses
    const allStudentIds = new Set<string>();
    courses.forEach((c: any) => {
      (c.enrolledStudents || []).forEach((sId: any) => allStudentIds.add(sId.toString()));
    });
    const totalStudents = allStudentIds.size;

    // Compute attendance statistics
    const courseIds = courses.map((c: any) => c._id);
    const attendanceRecords = await Attendance.find({ courseId: { $in: courseIds } }).lean();

    let totalPresent = 0;
    let totalRecords = 0;
    attendanceRecords.forEach((a: any) => {
      a.records.forEach((r: any) => {
        totalRecords++;
        if (r.status === "Present" || r.status === "Late") totalPresent++;
      });
    });
    const avgAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    // Compute grade distribution from attendance for the performance chart
    const gradeDistribution = totalRecords > 0 ? [
      { name: "Present", value: totalPresent, fill: "#10b981" },
      { name: "Late", value: attendanceRecords.reduce((acc: number, a: any) => acc + a.records.filter((r: any) => r.status === "Late").length, 0), fill: "#f59e0b" },
      { name: "Absent", value: totalRecords - totalPresent, fill: "#ef4444" },
    ] : [
      { name: "No Data", value: 1, fill: "#94a3b8" },
    ];

    const payload = {
      facultyProfile: {
        id: facultyProfile?._id || "",
        name: user.name,
        email: user.email,
        phone: facultyProfile?.contactNo || "",
        department: facultyProfile?.department || "General",
        designation: facultyProfile?.designation || "Professor",
        employeeId: facultyProfile?.employeeId || "",
        qualification: facultyProfile?.qualification || "",
        joiningDate: facultyProfile?.joiningDate ? new Date(facultyProfile.joiningDate).toISOString().split("T")[0] : "",
        status: "Active",
        officeLocation: facultyProfile?.officeLocation || "",
        publications: facultyProfile?.publications || 0,
        experience: facultyProfile?.experience || 0,
      },
      courses: courses.map((c: any) => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        credits: c.credits,
        type: c.type,
        program: c.program,
        semester: c.semester,
        enrolledCount: c.enrolledStudents?.length || 0,
      })),
      totalStudents,
      avgAttendance,
      attendanceMetrics: gradeDistribution,
      totalSessions: attendanceRecords.length,
      notifications: facultyProfile?.notifications || [],
    };

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error("Faculty Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
