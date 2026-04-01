import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET: Chat thread with a specific user
export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { userId: partnerId } = await params;
    const myId = new mongoose.Types.ObjectId(session.userId);
    const theirId = new mongoose.Types.ObjectId(partnerId);

    // Mark messages from partner as read
    await Message.updateMany(
      { senderId: theirId, receiverId: myId, read: false },
      { $set: { read: true } }
    );

    // Fetch messages
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: theirId },
        { senderId: theirId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Get partner info
    const partner = await User.findById(partnerId, "name email role avatar").lean();

    return NextResponse.json({
      success: true,
      partner,
      messages: messages.map((m: any) => ({
        _id: m._id,
        content: m.content,
        senderId: m.senderId,
        createdAt: m.createdAt,
        read: m.read,
        isMine: m.senderId.toString() === session.userId,
      })),
    });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Send a message to a specific user
export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { userId: receiverId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const message = await Message.create({
      senderId: session.userId,
      receiverId,
      content: content.trim(),
    });

    return NextResponse.json({
      success: true,
      message: {
        _id: message._id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
        isMine: true,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
