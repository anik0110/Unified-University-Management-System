import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// GET: List all students
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query: any = { role: "student" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    const userIds = users.map((u: any) => u._id);
    const studentProfiles = await Student.find({ userId: { $in: userIds } }).lean();

    const profileMap = new Map(studentProfiles.map((s: any) => [s.userId.toString(), s]));

    const students = users.map((u: any) => {
      const profile = profileMap.get(u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        enrollmentNo: profile?.enrollmentNo || "-",
        course: profile?.course || "-",
        branch: profile?.branch || "-",
        semester: profile?.semester || 1,
        section: profile?.section || "-",
        contactNo: profile?.contactNo || "-",
        bloodGroup: profile?.bloodGroup || "Unknown",
        cgpa: profile?.cgpa || 0,
        sgpa: profile?.sgpa || 0,
        admissionYear: profile?.admissionYear || "-",
        hostelBlock: profile?.hostelDetails?.block || "",
        hostelRoom: profile?.hostelDetails?.roomNo || "",
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({ success: true, students }, { status: 200 });
  } catch (error) {
    console.error("Admin Students GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new student (User + Student profile)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const {
      name, email, password, enrollmentNo, course, branch, semester,
      section, admissionYear, contactNo, bloodGroup, parentContact,
      address, hostelBlock, hostelRoom, cgpa, sgpa, feeDetails,
    } = body;

    if (!name || !email || !password || !enrollmentNo) {
      return NextResponse.json({ error: "Name, email, password, and enrollment no. are required" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: "student",
    });

    const newStudent = await Student.create({
      userId: newUser._id,
      enrollmentNo,
      course: course || "B.Tech",
      branch: branch || "Computer Science",
      semester: semester || 1,
      section: section || "A",
      admissionYear: admissionYear || new Date().getFullYear(),
      contactNo: contactNo || "",
      bloodGroup: bloodGroup || "Unknown",
      parentContact: parentContact || "",
      address: address || "",
      cgpa: cgpa || 0,
      sgpa: sgpa || 0,
      hostelDetails: {
        block: hostelBlock || "",
        roomNo: hostelRoom || "",
      },
      feeDetails: feeDetails || {
        totalFee: 185000,
        paid: 0,
        pending: 185000,
        dueDate: `${new Date().getFullYear()}-07-15`,
        installments: [],
        breakdown: [
          { head: "Tuition Fee", amount: 120000 },
          { head: "Lab Fee", amount: 15000 },
          { head: "Library Fee", amount: 8000 },
          { head: "Examination Fee", amount: 12000 },
          { head: "Hostel Fee", amount: 25000 },
          { head: "Miscellaneous", amount: 5000 },
        ],
      },
      notifications: [
        { id: 1, type: "admin", title: "Welcome to UUMS!", time: "Just now", read: false },
      ],
    });

    newUser.profileId = newStudent._id;
    await newUser.save();

    return NextResponse.json({
      success: true,
      message: "Student created successfully",
      student: { _id: newUser._id, name, email, enrollmentNo },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Admin Students POST error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Enrollment number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
