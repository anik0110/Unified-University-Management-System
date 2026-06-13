import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { FestRegistration } from "@/models/FestRegistration";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { eventId, teamMembers, teamName } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // Fetch event
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const festType = event.festType;
    if (!festType || !["Technical", "Cultural"].includes(festType)) {
      return NextResponse.json({ error: "This event is not linked to a fest" }, { status: 400 });
    }

    // Check leader has fest pass
    const leaderFestPass = await FestRegistration.findOne({
      userId: session.userId,
      festType,
    });
    if (!leaderFestPass) {
      return NextResponse.json(
        { error: `You must register for the ${festType} Fest first (buy a fest pass)` },
        { status: 403 }
      );
    }

    // Check leader hasn't already registered for this event
    const existingReg = await EventRegistration.findOne({
      eventId,
      leaderId: session.userId,
    });
    if (existingReg) {
      return NextResponse.json(
        { error: "You have already registered for this event" },
        { status: 400 }
      );
    }

    // Check leader is not already a team member in another registration for this event
    const leaderInOtherTeam = await EventRegistration.findOne({
      eventId,
      teamMembers: session.userId,
    });
    if (leaderInOtherTeam) {
      return NextResponse.json(
        { error: "You are already part of another team for this event" },
        { status: 400 }
      );
    }

    // Check capacity
    const currentRegCount = await EventRegistration.countDocuments({ eventId });
    if (currentRegCount >= event.capacity) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 });
    }

    // Build team members list
    let resolvedTeamMembers = [session.userId];

    if (event.maxTeamSize > 1 && teamMembers && teamMembers.length > 0) {
      // Total team = leader + other members
      const totalTeamSize = 1 + teamMembers.length;

      if (totalTeamSize < event.minTeamSize) {
        return NextResponse.json(
          { error: `Team must have at least ${event.minTeamSize} members (including you)` },
          { status: 400 }
        );
      }
      if (totalTeamSize > event.maxTeamSize) {
        return NextResponse.json(
          { error: `Team can have at most ${event.maxTeamSize} members (including you)` },
          { status: 400 }
        );
      }

      // Resolve member emails to user IDs
      const memberEmails: string[] = teamMembers;
      const memberUsers = await User.find({
        email: { $in: memberEmails },
      });

      if (memberUsers.length !== memberEmails.length) {
        const foundEmails = memberUsers.map((u: any) => u.email);
        const missing = memberEmails.filter((e: string) => !foundEmails.includes(e));
        return NextResponse.json(
          { error: `Users not found: ${missing.join(", ")}` },
          { status: 400 }
        );
      }

      // Validate: must be students only (not admin, professor, etc.)
      const nonStudents = memberUsers.filter(
        (u: any) => !["student"].includes(u.role)
      );
      if (nonStudents.length > 0) {
        return NextResponse.json(
          { error: `Only students can be added as team members. Non-students: ${nonStudents.map((u: any) => u.email).join(", ")}` },
          { status: 400 }
        );
      }

      // Validate: all team members must have fest pass
      const memberIds = memberUsers.map((u: any) => u._id);
      const memberFestPasses = await FestRegistration.find({
        userId: { $in: memberIds },
        festType,
      });
      if (memberFestPasses.length !== memberIds.length) {
        const passedIds = memberFestPasses.map((p: any) => p.userId.toString());
        const missing = memberUsers
          .filter((u: any) => !passedIds.includes(u._id.toString()))
          .map((u: any) => u.email);
        return NextResponse.json(
          { error: `These team members don't have a ${festType} Fest pass: ${missing.join(", ")}` },
          { status: 400 }
        );
      }

      // Validate: no team member is already in another team for this event
      const alreadyRegistered = await EventRegistration.find({
        eventId,
        teamMembers: { $in: memberIds },
      });
      if (alreadyRegistered.length > 0) {
        // Find which members are already in teams
        const takenIds = new Set<string>();
        alreadyRegistered.forEach((r: any) => {
          r.teamMembers.forEach((m: any) => {
            if (memberIds.some((id: any) => id.toString() === m.toString())) {
              takenIds.add(m.toString());
            }
          });
        });
        const takenEmails = memberUsers
          .filter((u: any) => takenIds.has(u._id.toString()))
          .map((u: any) => u.email);
        return NextResponse.json(
          { error: `These members are already in another team for this event: ${takenEmails.join(", ")}` },
          { status: 400 }
        );
      }

      resolvedTeamMembers = [session.userId, ...memberIds];
    } else if (event.minTeamSize > 1) {
      return NextResponse.json(
        { error: `This event requires at least ${event.minTeamSize} team members` },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await EventRegistration.create({
      eventId,
      festType,
      leaderId: session.userId,
      teamMembers: resolvedTeamMembers,
      teamName: teamName || "",
    });

    return NextResponse.json(
      { success: true, registration },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Already registered for this event" },
        { status: 400 }
      );
    }
    console.error("Event Register API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
