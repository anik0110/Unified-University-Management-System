import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

// GET: Fetch finance settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const finSettings = await Setting.findOne({ key: "finance" }).lean();
    
    return NextResponse.json({ 
      success: true, 
      settings: finSettings?.value || { tuitionFee: 50000, residenceFee: 20000, lateFine: 1000, dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) }
    }, { status: 200 });
  } catch (error) {
    console.error("Finance Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update finance settings (Accountant / Admin)
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (!["accountant", "super_admin", "director"].includes(session.role) && !(session.extraRoles || []).includes("accountant"))) {
      return NextResponse.json({ error: "Unauthorized. Accountant only." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { tuitionFee, residenceFee, lateFine, dueDate } = body;

    if (tuitionFee === undefined || residenceFee === undefined || lateFine === undefined || !dueDate) {
      return NextResponse.json({ error: "tuitionFee, residenceFee, lateFine, and dueDate are required" }, { status: 400 });
    }

    const value = { 
      tuitionFee: Number(tuitionFee), 
      residenceFee: Number(residenceFee),
      lateFine: Number(lateFine),
      dueDate: new Date(dueDate)
    };

    const updatedSetting = await Setting.findOneAndUpdate(
      { key: "finance" },
      { value, updatedBy: session.userId },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, settings: updatedSetting.value }, { status: 200 });
  } catch (error) {
    console.error("Finance Settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
