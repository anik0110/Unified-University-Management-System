import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Event } from "@/models/Event";
import { FestRegistration } from "@/models/FestRegistration";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch fest settings
    const festSettings = await Setting.findOne({ key: "fest" }).lean();
    const prices = festSettings?.value || { technicalFee: 500, culturalFee: 500 };

    // Fetch events linked to a fest
    const eventsData = await Event.find({ festType: { $in: ["Technical", "Cultural"] } })
      .sort({ date: 1 })
      .lean();

    // Fetch all registrations
    const registrationsData = await FestRegistration.find()
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate stats
    const totalTechnicalRegs = registrationsData.filter((r: any) => r.festType === "Technical").length;
    const totalCulturalRegs = registrationsData.filter((r: any) => r.festType === "Cultural").length;
    
    const technicalRevenue = totalTechnicalRegs * prices.technicalFee;
    const culturalRevenue = totalCulturalRegs * prices.culturalFee;
    const totalRevenue = technicalRevenue + culturalRevenue;

    const festStats = {
      totalFests: 2, // Tech and Cultural
      totalEvents: eventsData.length,
      totalRegistrations: registrationsData.length,
      totalRevenue: totalRevenue,
      revenueByFest: [
        { fest: "Technical Fest", revenue: technicalRevenue },
        { fest: "Cultural Fest", revenue: culturalRevenue }
      ],
      prices
    };

    // Format events for UI
    const festEvents = eventsData.map((e: any) => ({
      id: e._id.toString(),
      name: e.title,
      category: e.festType,
      date: new Date(e.date).toLocaleDateString(),
      venue: e.venue,
      fee: e.festType === "Technical" ? prices.technicalFee : prices.culturalFee,
      status: "Open", // logic could be added to check date
      fest: e.festType + " Fest"
    }));

    // Format registrations
    const festRegistrations = registrationsData.map((r: any) => ({
      id: r._id.toString(),
      event: r.festType + " Fest Registration",
      festType: r.festType,
      studentId: r.userId?._id?.toString(),
      student: r.userId?.name || "Unknown",
      fee: r.festType === "Technical" ? prices.technicalFee : prices.culturalFee,
      paymentStatus: "Paid",
      date: r.registeredAt
    }));

    const payload = {
      festEvents,
      festRegistrations,
      festStats
    };

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error("Fest Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
