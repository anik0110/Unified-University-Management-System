import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Attendance } from "@/models/Attendance";
import { Setting } from "@/models/Setting";
import { Transaction } from "@/models/Transaction";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const studentProfile = await Student.findOne({ userId: session.userId });
    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Get enrolled courses from Course model
    const enrolledCourses = await Course.find({ enrolledStudents: session.userId })
      .populate("facultyId", "name")
      .lean();

    // Get attendance records for all enrolled courses
    const courseIds = enrolledCourses.map((c: any) => c._id);
    const attendanceRecords = await Attendance.find({ courseId: { $in: courseIds } }).lean();

    // Compute per-subject attendance
    const attendanceData = enrolledCourses.map((course: any) => {
      const courseAttendance = attendanceRecords.filter((a: any) => a.courseId.toString() === course._id.toString());
      let attended = 0;
      let total = 0;
      courseAttendance.forEach((a: any) => {
        const record = a.records.find((r: any) => r.studentId.toString() === session.userId);
        if (record) {
          total++;
          if (record.status === "Present" || record.status === "Late") attended++;
        }
      });
      return {
        subject: course.name,
        code: course.code,
        attended,
        total,
        percentage: total > 0 ? Math.round((attended / total) * 100) : 0,
      };
    });

    // Compute monthly attendance
    const monthlyMap = new Map<string, { attended: number; total: number }>();
    attendanceRecords.forEach((a: any) => {
      const month = new Date(a.date).toLocaleString("en-US", { month: "short" });
      const record = a.records.find((r: any) => r.studentId.toString() === session.userId);
      if (record) {
        if (!monthlyMap.has(month)) monthlyMap.set(month, { attended: 0, total: 0 });
        const entry = monthlyMap.get(month)!;
        entry.total++;
        if (record.status === "Present" || record.status === "Late") entry.attended++;
      }
    });
    const monthlyAttendance = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      percentage: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
    }));

    // Build semester grades from student profile (admin-editable)
    const semesterGrades = [];
    for (let i = 1; i <= (studentProfile.semester || 1); i++) {
      semesterGrades.push({
        semester: `Sem ${i}`,
        sgpa: i === studentProfile.semester ? (studentProfile.sgpa || 0) : 0,
        cgpa: i === studentProfile.semester ? (studentProfile.cgpa || 0) : 0,
      });
    }

    // Format courses list
    const courses = enrolledCourses.map((c: any) => ({
      code: c.code,
      name: c.name,
      credits: c.credits,
      faculty: c.facultyId?.name || "Unassigned",
      grade: "-",
      type: c.type,
    }));

    // Calculate Fee Details Dynamically
    const finSettingsDoc = await Setting.findOne({ key: "finance" }).lean();
    const finSettings = finSettingsDoc?.value || { tuitionFee: 50000, residenceFee: 20000, lateFine: 1000, dueDate: new Date() };

    const transactions = await Transaction.find({ userId: session.userId, status: "Success", type: { $in: ["Tuition", "Residence"] } }).lean();
    
    const hasPaidTuition = transactions.find((t: any) => t.type === "Tuition");
    const hasPaidResidence = transactions.find((t: any) => t.type === "Residence");

    let totalFee = finSettings.tuitionFee + finSettings.residenceFee;
    let paid = 0;
    
    const breakdown = [
      { head: "Tuition Fee", amount: finSettings.tuitionFee },
      { head: "Residence Fee", amount: finSettings.residenceFee }
    ];

    const installments = [];

    // Tuition logic
    if (hasPaidTuition) {
      paid += hasPaidTuition.amount;
      installments.push({
        id: "1", type: "Tuition", amount: hasPaidTuition.amount, date: new Date(hasPaidTuition.createdAt).toLocaleDateString("en-IN"), status: "Paid", txnId: hasPaidTuition._id.toString()
      });
    } else {
      let currentDue = finSettings.tuitionFee;
      if (new Date() > new Date(finSettings.dueDate)) currentDue += finSettings.lateFine;
      installments.push({
        id: "1", type: "Tuition", amount: currentDue, date: new Date(finSettings.dueDate).toLocaleDateString("en-IN"), status: "Pending", txnId: null
      });
    }

    // Residence logic
    if (hasPaidResidence) {
      paid += hasPaidResidence.amount;
      installments.push({
        id: "2", type: "Residence", amount: hasPaidResidence.amount, date: new Date(hasPaidResidence.createdAt).toLocaleDateString("en-IN"), status: "Paid", txnId: hasPaidResidence._id.toString()
      });
    } else {
      let currentDue = finSettings.residenceFee;
      if (new Date() > new Date(finSettings.dueDate)) currentDue += finSettings.lateFine;
      installments.push({
        id: "2", type: "Residence", amount: currentDue, date: new Date(finSettings.dueDate).toLocaleDateString("en-IN"), status: "Pending", txnId: null
      });
    }

    const pending = totalFee - paid;
    // Note: pending doesn't strictly equal totalFee - paid anymore due to late fines. 
    // Let's recalculate pending precisely:
    const precisePending = installments.filter((i: any) => i.status === "Pending").reduce((sum: number, i: any) => sum + i.amount, 0);

    const feeDetails = {
      totalFee,
      paid,
      pending: precisePending,
      dueDate: new Date(finSettings.dueDate).toLocaleDateString("en-IN"),
      installments,
      breakdown
    };

    const payload = {
      studentProfile: {
        id: studentProfile._id,
        name: user.name,
        email: user.email,
        phone: studentProfile.contactNo,
        program: `${studentProfile.course} ${studentProfile.branch}`,
        semester: studentProfile.semester,
        section: studentProfile.section,
        enrollmentNo: studentProfile.enrollmentNo,
        admissionYear: studentProfile.admissionYear,
        cgpa: studentProfile.cgpa,
        sgpa: studentProfile.sgpa,
        status: "Active",
        hostelRoom: studentProfile.hostelDetails?.roomNo || "None",
        bloodGroup: studentProfile.bloodGroup || "Unknown",
      },
      semesterGrades,
      attendanceData: attendanceData.length > 0 ? attendanceData : [
        { subject: "No courses enrolled", code: "-", attended: 0, total: 0, percentage: 0 },
      ],
      monthlyAttendance: monthlyAttendance.length > 0 ? monthlyAttendance : [],
      courses: courses.length > 0 ? courses : [],
      feeDetails,
      notifications: studentProfile.notifications || [],
    };

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error("Student Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
