import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (!["accountant", "super_admin", "director"].includes(session.role) && !(session.extraRoles || []).includes("accountant"))) {
      return NextResponse.json({ error: "Unauthorized. Accountant only." }, { status: 401 });
    }

    await connectDB();

    // Get current finance settings
    const finSettings = await Setting.findOne({ key: "finance" }).lean();
    const settings = finSettings?.value || { tuitionFee: 50000, residenceFee: 20000, lateFine: 1000, dueDate: new Date() };

    // Get all successful tuition and residence transactions
    const successfulTransactions = await Transaction.find({ 
      type: { $in: ["Tuition", "Residence"] },
      status: "Success" 
    }).populate("userId", "name email").sort({ createdAt: -1 }).lean();

    // Aggregate revenue
    let totalTuitionRevenue = 0;
    let totalResidenceRevenue = 0;

    successfulTransactions.forEach((t: any) => {
      if (t.type === "Tuition") totalTuitionRevenue += t.amount;
      if (t.type === "Residence") totalResidenceRevenue += t.amount;
    });

    const collectionStats = {
      totalTarget: 50000000, // Hardcoded target for demo
      collected: totalTuitionRevenue + totalResidenceRevenue,
      monthlyTrend: [
        { month: "Jan", amount: Math.floor((totalTuitionRevenue + totalResidenceRevenue) * 0.1) },
        { month: "Feb", amount: Math.floor((totalTuitionRevenue + totalResidenceRevenue) * 0.2) },
        { month: "Mar", amount: Math.floor((totalTuitionRevenue + totalResidenceRevenue) * 0.7) }
      ],
      programWise: [
        { name: "B.Tech", value: Math.floor((totalTuitionRevenue + totalResidenceRevenue) * 0.6), fill: "#3b82f6" },
        { name: "M.Tech", value: Math.floor((totalTuitionRevenue + totalResidenceRevenue) * 0.3), fill: "#10b981" },
        { name: "BCA", value: Math.floor((totalTuitionRevenue + totalResidenceRevenue) * 0.1), fill: "#f59e0b" }
      ]
    };

    const payload = {
      feeStructure: [
        { id: "1", type: "Tuition Fee", amount: settings.tuitionFee, deadline: settings.dueDate },
        { id: "2", type: "Hostel Fee", amount: settings.residenceFee, deadline: settings.dueDate }
      ],
      recentTransactions: successfulTransactions.slice(0, 10).map((t: any) => ({
        id: t._id.toString(),
        student: t.userId?.name || "Unknown",
        studentId: "U-" + t.userId?._id.toString().substring(0,4),
        amount: t.amount,
        date: t.createdAt,
        status: t.status,
        type: t.type + " Fee"
      })),
      collectionStats
    };

    return NextResponse.json({ success: true, data: payload }, { status: 200 });

  } catch (error) {
    console.error("Finance Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
