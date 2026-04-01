import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course";
import { Attendance } from "@/models/Attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Real counts from DB
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalFaculty = await User.countDocuments({ role: { $in: ["professor", "hod", "dean"] } });
    const totalCourses = await Course.countDocuments();

    // Fee collection stats from Student profiles
    const students = await Student.find({}, "feeDetails").lean();
    let totalCollected = 0;
    let totalExpected = 0;
    students.forEach((s: any) => {
      if (s.feeDetails) {
        totalCollected += s.feeDetails.paid || 0;
        totalExpected += s.feeDetails.totalFee || 0;
      }
    });

    // Enrollment trends by year
    const studentsByYear = await Student.aggregate([
      { $group: { _id: "$admissionYear", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { year: { $toString: "$_id" }, count: 1, _id: 0 } },
    ]);
    const enrollmentTrends = studentsByYear.length > 0 ? studentsByYear : [
      { year: String(new Date().getFullYear()), count: totalStudents },
    ];

    // Risk analytics by department (aggregate from real data)
    const riskAnalytics = await Student.aggregate([
      { $group: {
        _id: "$branch",
        total: { $sum: 1 },
        lowCgpa: { $sum: { $cond: [{ $lt: ["$cgpa", 5] }, 1, 0] } },
        feeDefault: { $sum: { $cond: [{ $gt: [{ $ifNull: ["$feeDetails.pending", 0] }, 0] }, 1, 0] } },
      }},
      { $project: {
        _id: 0,
        department: { $ifNull: ["$_id", "Other"] },
        lowAttendance: { $literal: 0 },
        poorGrades: "$lowCgpa",
        feeDefault: "$feeDefault",
      }},
    ]);

    const collectionStats = {
      totalCollected: totalCollected || 0,
      totalExpected: totalExpected || 1,
    };

    const payload = {
      totalStudents,
      totalFaculty,
      totalCourses,
      enrollmentTrends,
      riskAnalytics: riskAnalytics.length > 0 ? riskAnalytics : [
        { department: "CS", lowAttendance: 0, poorGrades: 0, feeDefault: 0 },
      ],
      collectionStats,
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("Admin Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
