import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "fallback_key_for_build");

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Return 200 even if user not found to prevent email enumeration attacks
      return NextResponse.json({ success: true, message: "If an account exists, an OTP has been sent." }, { status: 200 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "UUMS System <onboarding@resend.dev>", // Or verified domain
        to: user.email,
        subject: "UUMS Password Reset OTP",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You have requested to reset your password for the UUMS portal.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="background: #f4f4f5; padding: 10px; text-align: center; letter-spacing: 5px; color: #4f46e5;">${otp}</h1>
            <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[RESEND MOCK] OTP for ${user.email} is: ${otp}`);
    }

    return NextResponse.json({ success: true, message: "If an account exists, an OTP has been sent." }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
