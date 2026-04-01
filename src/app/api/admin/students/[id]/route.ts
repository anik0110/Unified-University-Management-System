import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Course } from "@/models/Course";

export const dynamic = "force-dynamic";

// GET: Single student details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).lean();
    if (!user || (user as any).role !== "student") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const profile = await Student.findOne({ userId: id }).lean();
    const enrolledCourses = await Course.find({ enrolledStudents: id }).populate("facultyId", "name").lean();

    return NextResponse.json({
      success: true,
      student: {
        ...(user as any),
        profile,
        courses: enrolledCourses.map((c: any) => ({
          _id: c._id,
          code: c.code,
          name: c.name,
          credits: c.credits,
          type: c.type,
          program: c.program,
          semester: c.semester,
          faculty: c.facultyId?.name || "Unassigned",
        })),
      },
    });
  } catch (error) {
    console.error("Admin Student GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update student details
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
      name, contactNo, bloodGroup, semester, section, cgpa, sgpa,
      hostelBlock, hostelRoom, feeDetails, courseIds,
    } = body;

    // Update User document
    if (name) {
      await User.findByIdAndUpdate(id, { name });
    }

    // Update Student profile
    const updateData: any = {};
    if (contactNo !== undefined) updateData.contactNo = contactNo;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (semester !== undefined) updateData.semester = semester;
    if (section !== undefined) updateData.section = section;
    if (cgpa !== undefined) updateData.cgpa = cgpa;
    if (sgpa !== undefined) updateData.sgpa = sgpa;
    if (hostelBlock !== undefined || hostelRoom !== undefined) {
      updateData["hostelDetails.block"] = hostelBlock || "";
      updateData["hostelDetails.roomNo"] = hostelRoom || "";
    }
    if (feeDetails) updateData.feeDetails = feeDetails;

    if (Object.keys(updateData).length > 0) {
      await Student.findOneAndUpdate({ userId: id }, { $set: updateData });
    }

    // Update course enrollments if provided
    if (courseIds && Array.isArray(courseIds)) {
      // Remove student from all current courses
      await Course.updateMany(
        { enrolledStudents: id },
        { $pull: { enrolledStudents: id } }
      );
      // Add student to specified courses
      if (courseIds.length > 0) {
        await Course.updateMany(
          { _id: { $in: courseIds } },
          { $addToSet: { enrolledStudents: id } }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Student updated successfully" });
  } catch (error) {
    console.error("Admin Student PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove student
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;

    await Student.findOneAndDelete({ userId: id });
    await Course.updateMany({ enrolledStudents: id }, { $pull: { enrolledStudents: id } });
    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Admin Student DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
