import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

// GET: Fetch library settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const libSettings = await Setting.findOne({ key: "library" }).lean();
    
    return NextResponse.json({ 
      success: true, 
      settings: libSettings?.value || { maxIssueDays: 14, dailyFine: 5 }
    }, { status: 200 });
  } catch (error) {
    console.error("Library Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update library settings (Librarian / Admin)
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (!["librarian", "super_admin", "director", "dean"].includes(session.role) && !(session.extraRoles || []).includes("librarian"))) {
      return NextResponse.json({ error: "Unauthorized. Librarian only." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { maxIssueDays, dailyFine } = body;

    if (maxIssueDays === undefined || dailyFine === undefined) {
      return NextResponse.json({ error: "maxIssueDays and dailyFine are required" }, { status: 400 });
    }

    const value = { maxIssueDays: Number(maxIssueDays), dailyFine: Number(dailyFine) };

    const updatedSetting = await Setting.findOneAndUpdate(
      { key: "library" },
      { value, updatedBy: session.userId },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, settings: updatedSetting.value }, { status: 200 });
  } catch (error) {
    console.error("Library Settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
