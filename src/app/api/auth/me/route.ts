import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Fetch user without sensitive data
    const user = await User.findById(session.userId).select("-passwordHash -otp -otpExpiry");
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth Me API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
