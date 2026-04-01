import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Faculty } from "@/models/Faculty";
import { Course } from "@/models/Course";

export const dynamic = "force-dynamic";

// GET: Single faculty/staff details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const profile = await Faculty.findOne({ userId: id }).lean();
    const assignedCourses = await Course.find({ facultyId: id }).lean();

    return NextResponse.json({
      success: true,
      faculty: {
        ...(user as any),
        extraRoles: (user as any).extraRoles || [],
        profile,
        courses: assignedCourses.map((c: any) => ({
          _id: c._id,
          code: c.code,
          name: c.name,
          credits: c.credits,
          program: c.program,
          semester: c.semester,
          enrolledCount: c.enrolledStudents?.length || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Admin Faculty [id] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update faculty details / role / assign courses
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const {
      name, role, extraRoles, department, designation, qualification,
      contactNo, experience, publications, officeLocation, courseIds,
    } = body;

    // Update User (name, role, extraRoles)
    const userUpdate: any = {};
    if (name) userUpdate.name = name;
    if (role) userUpdate.role = role;
    if (extraRoles !== undefined) userUpdate.extraRoles = extraRoles;
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(id, userUpdate);
    }

    // Update Faculty profile
    const profileUpdate: any = {};
    if (department !== undefined) profileUpdate.department = department;
    if (designation !== undefined) profileUpdate.designation = designation;
    if (qualification !== undefined) profileUpdate.qualification = qualification;
    if (contactNo !== undefined) profileUpdate.contactNo = contactNo;
    if (experience !== undefined) profileUpdate.experience = experience;
    if (publications !== undefined) profileUpdate.publications = publications;
    if (officeLocation !== undefined) profileUpdate.officeLocation = officeLocation;

    if (Object.keys(profileUpdate).length > 0) {
      await Faculty.findOneAndUpdate({ userId: id }, { $set: profileUpdate });
    }

    // Reassign courses if provided
    if (courseIds && Array.isArray(courseIds)) {
      // Unassign all current courses from this faculty
      await Course.updateMany({ facultyId: id }, { $unset: { facultyId: "" } });
      // Assign specified courses
      if (courseIds.length > 0) {
        await Course.updateMany(
          { _id: { $in: courseIds } },
          { $set: { facultyId: id } }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Faculty updated successfully" });
  } catch (error) {
    console.error("Admin Faculty PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
