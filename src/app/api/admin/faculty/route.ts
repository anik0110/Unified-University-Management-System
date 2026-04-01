import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Faculty } from "@/models/Faculty";
import { Course } from "@/models/Course";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// GET: List all faculty/staff
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Faculty roles include professor, hod, dean, warden, etc.
    const facultyRoles = ["professor", "hod", "dean", "hostel_warden", "chief_warden", "hostel_supervisor", "accountant", "fest_coordinator"];
    const query: any = { role: { $in: facultyRoles } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    const userIds = users.map((u: any) => u._id);
    const facultyProfiles = await Faculty.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(facultyProfiles.map((f: any) => [f.userId.toString(), f]));

    // Get course assignments
    const courseAssignments = await Course.find({ facultyId: { $in: userIds } }).lean();
    const courseMap = new Map<string, any[]>();
    courseAssignments.forEach((c: any) => {
      const fId = c.facultyId.toString();
      if (!courseMap.has(fId)) courseMap.set(fId, []);
      courseMap.get(fId)!.push({ code: c.code, name: c.name });
    });

    const faculty = users.map((u: any) => {
      const profile = profileMap.get(u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        employeeId: profile?.employeeId || "-",
        department: profile?.department || "-",
        designation: profile?.designation || "-",
        qualification: profile?.qualification || "-",
        contactNo: profile?.contactNo || "-",
        experience: profile?.experience || 0,
        publications: profile?.publications || 0,
        courses: courseMap.get(u._id.toString()) || [],
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({ success: true, faculty }, { status: 200 });
  } catch (error) {
    console.error("Admin Faculty GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new faculty/staff member
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const {
      name, email, password, role, employeeId, department, designation,
      qualification, contactNo, experience, publications, officeLocation,
    } = body;

    if (!name || !email || !password || !role || !employeeId) {
      return NextResponse.json({ error: "Name, email, password, role, and employee ID are required" }, { status: 400 });
    }

    const validRoles = ["professor", "hod", "dean", "hostel_warden", "chief_warden", "hostel_supervisor", "accountant", "fest_coordinator"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
    }

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
      role,
    });

    const newFaculty = await Faculty.create({
      userId: newUser._id,
      employeeId,
      department: department || "General",
      designation: designation || role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      qualification: qualification || "N/A",
      joiningDate: new Date(),
      contactNo: contactNo || "",
      officeLocation: officeLocation || "Main Block",
      experience: experience || 0,
      publications: publications || 0,
      notifications: [
        { id: 1, type: "admin", title: "Welcome to UUMS!", time: "Just now", read: false },
      ],
    });

    newUser.profileId = newFaculty._id;
    await newUser.save();

    return NextResponse.json({
      success: true,
      message: "Faculty/Staff member created successfully",
      faculty: { _id: newUser._id, name, email, role, employeeId },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Admin Faculty POST error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
