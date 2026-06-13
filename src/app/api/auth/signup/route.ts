import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Faculty } from "@/models/Faculty";
import bcrypt from "bcryptjs";

const ALLOWED_EMAIL_DOMAIN = "@uums.ac.in";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, role, registrationNo, contactNo } = body;

    // --- Basic Validation ---
    if (!name || !email || !password || !role || !registrationNo || !contactNo) {
      return NextResponse.json(
        { error: "All required fields must be filled." },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return NextResponse.json(
        { error: `Only university emails (${ALLOWED_EMAIL_DOMAIN}) are allowed.` },
        { status: 400 }
      );
    }

    // Validate role (only student and professor can self-register)
    if (!["student", "professor"].includes(role)) {
      return NextResponse.json(
        { error: "You can only register as a Student or Professor." },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User with PENDING status
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      accountStatus: "PENDING",
      registrationNo,
    });

    // Create role-specific profile
    if (role === "student") {
      const {
        course, branch, semester, section,
        admissionYear, bloodGroup,
      } = body;

      const newStudent = await Student.create({
        userId: newUser._id,
        enrollmentNo: registrationNo,
        course: course || "B.Tech",
        branch: branch || "Computer Science",
        semester: semester || 1,
        section: section || "A",
        admissionYear: admissionYear || new Date().getFullYear(),
        contactNo,
        bloodGroup: bloodGroup || "Unknown",
        parentContact: "",
        address: "",
        cgpa: 0,
        sgpa: 0,
        hostelDetails: { block: "", roomNo: "" },
        feeDetails: {
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
        notifications: [],
      });

      newUser.profileId = newStudent._id;
      await newUser.save();
    } else if (role === "professor") {
      const { department, designation, qualification } = body;

      const newFaculty = await Faculty.create({
        userId: newUser._id,
        employeeId: registrationNo,
        department: department || "General",
        designation: designation || "Assistant Professor",
        qualification: qualification || "N/A",
        joiningDate: new Date(),
        contactNo,
        officeLocation: "Main Academic Block",
        experience: 0,
        publications: 0,
        notifications: [],
      });

      newUser.profileId = newFaculty._id;
      await newUser.save();
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Your registration has been submitted successfully! You will receive an email once the admin reviews your application.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Registration number or email already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
