import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// PATCH: Approve or Reject a pending registration
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "director", "dean"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'." }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.accountStatus !== "PENDING") {
      return NextResponse.json({ error: "This user is not in PENDING status." }, { status: 400 });
    }

    if (action === "approve") {
      user.accountStatus = "APPROVED";
      user.rejectionReason = undefined;
      await user.save();

      // Send approval email
      try {
        await resend.emails.send({
          from: "UUMS <onboarding@resend.dev>",
          to: user.email,
          subject: "🎉 Your UUMS Account Has Been Approved!",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #10b981; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px;">✓</div>
              </div>
              <h1 style="text-align: center; color: #0f172a; margin-bottom: 16px;">Account Approved!</h1>
              <p style="color: #475569; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #475569; line-height: 1.6;">Great news! Your registration at the Unified University Management System (UUMS) has been <strong style="color: #10b981;">approved</strong> by the administration.</p>
              <p style="color: #475569; line-height: 1.6;">You can now log in with your registered email and password to access your dashboard.</p>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Sign In Now →</a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">UUMS — Unified University Management System</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: `${user.name}'s account has been approved.`,
      });
    } else {
      // Reject
      user.accountStatus = "REJECTED";
      user.rejectionReason = rejectionReason || "Your application did not meet the requirements.";
      await user.save();

      // Send rejection email
      try {
        await resend.emails.send({
          from: "UUMS <onboarding@resend.dev>",
          to: user.email,
          subject: "UUMS Registration Update",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #ef4444; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px;">✕</div>
              </div>
              <h1 style="text-align: center; color: #0f172a; margin-bottom: 16px;">Registration Update</h1>
              <p style="color: #475569; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #475569; line-height: 1.6;">We regret to inform you that your registration at the Unified University Management System (UUMS) has been <strong style="color: #ef4444;">declined</strong>.</p>
              ${rejectionReason ? `<p style="color: #475569; line-height: 1.6;"><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
              <p style="color: #475569; line-height: 1.6;">If you believe this is an error, please contact the university administration for further assistance.</p>
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">UUMS — Unified University Management System</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      return NextResponse.json({
        success: true,
        message: `${user.name}'s registration has been declined.`,
      });
    }
  } catch (error) {
    console.error("Admin Approvals PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
