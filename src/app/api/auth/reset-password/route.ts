import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { decrypt } from "@/lib/auth-util";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json({ error: "Reset token and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const decoded = await decrypt(resetToken);
    
    if (!decoded || decoded.type !== "reset" || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
       return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: "Password reset completely successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
