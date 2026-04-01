import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-util";

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
