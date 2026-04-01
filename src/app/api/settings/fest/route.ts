import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

// GET: Fetch fest settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const festSettings = await Setting.findOne({ key: "fest" }).lean();
    
    return NextResponse.json({ 
      success: true, 
      settings: festSettings?.value || { technicalFee: 500, culturalFee: 500 }
    }, { status: 200 });
  } catch (error) {
    console.error("Fest Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update fest settings (Fest Coordinator / Admin)
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (!["fest_coordinator", "super_admin", "director", "dean"].includes(session.role) && !(session.extraRoles || []).includes("fest_coordinator"))) {
      return NextResponse.json({ error: "Unauthorized. Fest Coordinator only." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { technicalFee, culturalFee } = body;

    if (technicalFee === undefined || culturalFee === undefined) {
      return NextResponse.json({ error: "Both technicalFee and culturalFee are required" }, { status: 400 });
    }

    const value = { technicalFee: Number(technicalFee), culturalFee: Number(culturalFee) };

    const updatedSetting = await Setting.findOneAndUpdate(
      { key: "fest" },
      { value, updatedBy: session.userId },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, settings: updatedSetting.value }, { status: 200 });
  } catch (error) {
    console.error("Fest Settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
