import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Message } from "@/models/Message";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

// GET: List conversations (unique users the current user has messaged with)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userId = session.userId;

    // Get all unique conversation partners
    const sent = await Message.aggregate([
      { $match: { senderId: new (await import("mongoose")).default.Types.ObjectId(userId) } },
      { $group: { _id: "$receiverId", lastMessage: { $last: "$content" }, lastTime: { $last: "$createdAt" } } },
    ]);
    const received = await Message.aggregate([
      { $match: { receiverId: new (await import("mongoose")).default.Types.ObjectId(userId) } },
      { $group: { _id: "$senderId", lastMessage: { $last: "$content" }, lastTime: { $last: "$createdAt" }, unread: { $sum: { $cond: ["$read", 0, 1] } } } },
    ]);

    // Merge conversations
    const convMap = new Map<string, any>();
    sent.forEach((s: any) => {
      convMap.set(s._id.toString(), { partnerId: s._id, lastMessage: s.lastMessage, lastTime: s.lastTime, unread: 0 });
    });
    received.forEach((r: any) => {
      const key = r._id.toString();
      const existing = convMap.get(key);
      if (!existing || r.lastTime > existing.lastTime) {
        convMap.set(key, { partnerId: r._id, lastMessage: r.lastMessage, lastTime: r.lastTime, unread: r.unread });
      } else if (existing) {
        existing.unread = r.unread;
      }
    });

    // Get user details
    const partnerIds = Array.from(convMap.keys());
    const users = await User.find({ _id: { $in: partnerIds } }, "name email role avatar").lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const conversations = Array.from(convMap.values())
      .map((conv: any) => ({
        ...conv,
        partner: userMap.get(conv.partnerId.toString()) || { name: "Unknown", email: "" },
      }))
      .sort((a: any, b: any) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
