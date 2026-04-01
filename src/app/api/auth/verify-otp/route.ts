import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { encrypt } from "@/lib/auth-util";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || user.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // OTP is valid. Clear it and issue a short-lived reset token (JWT)
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Create a 15-minute token specific for password reset
    const resetToken = await encrypt({ userId: user._id.toString(), type: "reset" });

    return NextResponse.json({ 
      success: true, 
      resetToken, 
      message: "OTP verified successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
