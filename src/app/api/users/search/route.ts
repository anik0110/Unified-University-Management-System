import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

// GET: Search users by name (for starting new conversations)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await User.find({
      _id: { $ne: session.userId },
      name: { $regex: q, $options: "i" },
    }, "name email role avatar")
      .limit(10)
      .lean();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
