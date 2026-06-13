import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Faculty } from "@/models/Faculty";

export const dynamic = "force-dynamic";

// GET: List all pending registration requests
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const pendingUsers = await User.find({ accountStatus: "PENDING" })
      .select("-passwordHash -otp -otpExpiry")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch associated profiles
    const userIds = pendingUsers.map((u: any) => u._id);
    const studentProfiles = await Student.find({ userId: { $in: userIds } }).lean();
    const facultyProfiles = await Faculty.find({ userId: { $in: userIds } }).lean();

    const studentMap = new Map(studentProfiles.map((s: any) => [s.userId.toString(), s]));
    const facultyMap = new Map(facultyProfiles.map((f: any) => [f.userId.toString(), f]));

    const approvals = pendingUsers.map((u: any) => {
      const studentProfile = studentMap.get(u._id.toString());
      const facultyProfile = facultyMap.get(u._id.toString());

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        registrationNo: u.registrationNo || "-",
        accountStatus: u.accountStatus,
        createdAt: u.createdAt,
        // Student-specific
        course: studentProfile?.course,
        branch: studentProfile?.branch,
        semester: studentProfile?.semester,
        section: studentProfile?.section,
        admissionYear: studentProfile?.admissionYear,
        contactNo: studentProfile?.contactNo || facultyProfile?.contactNo || "-",
        bloodGroup: studentProfile?.bloodGroup,
        // Faculty-specific
        department: facultyProfile?.department,
        designation: facultyProfile?.designation,
        qualification: facultyProfile?.qualification,
        employeeId: facultyProfile?.employeeId,
      };
    });

    // Also get counts for the badge
    const pendingCount = await User.countDocuments({ accountStatus: "PENDING" });

    return NextResponse.json({ success: true, approvals, pendingCount }, { status: 200 });
  } catch (error) {
    console.error("Admin Approvals GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
