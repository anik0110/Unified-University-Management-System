import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Event } from "@/models/Event";
import { FestRegistration } from "@/models/FestRegistration";
import { EventRegistration } from "@/models/EventRegistration";
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

    // Fetch all fest registrations
    const registrationsData = await FestRegistration.find()
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all event registrations
    const eventRegistrations = await EventRegistration.find()
      .populate("leaderId", "name email")
      .lean();

    // Check user's fest passes
    const userFestPasses = await FestRegistration.find({ userId: session.userId }).lean();
    const userPassMap: Record<string, boolean> = {};
    userFestPasses.forEach((p: any) => {
      userPassMap[p.festType] = true;
    });

    // Aggregate stats
    const totalTechnicalRegs = registrationsData.filter((r: any) => r.festType === "Technical").length;
    const totalCulturalRegs = registrationsData.filter((r: any) => r.festType === "Cultural").length;
    
    const technicalRevenue = totalTechnicalRegs * prices.technicalFee;
    const culturalRevenue = totalCulturalRegs * prices.culturalFee;
    const totalRevenue = technicalRevenue + culturalRevenue;

    // Count events per fest
    const technicalEvents = eventsData.filter((e: any) => e.festType === "Technical").length;
    const culturalEvents = eventsData.filter((e: any) => e.festType === "Cultural").length;

    // Count event registrations per fest
    const techEventRegs = eventRegistrations.filter((r: any) => r.festType === "Technical").length;
    const cultEventRegs = eventRegistrations.filter((r: any) => r.festType === "Cultural").length;

    const festStats = {
      totalFests: 2,
      totalEvents: eventsData.length,
      totalRegistrations: registrationsData.length,
      totalRevenue: totalRevenue,
      revenueByFest: [
        { fest: "Technical Fest", revenue: technicalRevenue, registrations: totalTechnicalRegs, events: technicalEvents, eventRegistrations: techEventRegs },
        { fest: "Cultural Fest", revenue: culturalRevenue, registrations: totalCulturalRegs, events: culturalEvents, eventRegistrations: cultEventRegs }
      ],
      prices
    };

    // Format events for UI
    const festEvents = eventsData.map((e: any) => {
      const eventRegs = eventRegistrations.filter(
        (r: any) => r.eventId.toString() === e._id.toString()
      );
      return {
        id: e._id.toString(),
        name: e.title,
        category: e.festType,
        date: new Date(e.date).toLocaleDateString(),
        venue: e.venue,
        fee: e.festType === "Technical" ? prices.technicalFee : prices.culturalFee,
        status: eventRegs.length >= (e.capacity || 100) ? "Full" : "Open",
        fest: e.festType + " Fest",
        minTeamSize: e.minTeamSize || 1,
        maxTeamSize: e.maxTeamSize || 1,
        capacity: e.capacity || 100,
        registrations: eventRegs.length,
      };
    });

    // Format fest registrations
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
      festStats,
      userFestPasses: userPassMap,
    };

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error("Fest Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
