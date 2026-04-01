import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-util";
import connectDB from "@/lib/db";
import { Complaint } from "@/models/Complaint";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Check if Warden or Student
    let activeComplaints: any[] = [];
    if (["hostel_warden", "chief_warden", "super_admin"].includes(session.role)) {
      activeComplaints = await Complaint.find().sort({ filedAt: -1 }).populate("studentId", "name").lean();
    } else if (session.role === "student") {
      activeComplaints = await Complaint.find({ studentId: session.userId }).sort({ filedAt: -1 }).lean();
    }

    // Since we don't have massive Schemas for every single static array (rooms, mess menu, visitors)
    // We will return a hybrid payload. The dynamic data comes from DB, the static layout from here 
    // to satisfy the frontend without writing 30 separate Schemas for a prototype.
    // Build complaint list — use DB data if available, otherwise provide demo data
    let complaintList: any[];
    if (activeComplaints.length > 0) {
      complaintList = activeComplaints.map((c: any) => ({
        id: c.ticketId,
        studentName: c.studentId?.name || "Student",
        room: c.roomNo,
        category: c.category,
        title: c.title || c.description?.slice(0, 40) || c.category,
        priority: c.priority || "Medium",
        status: c.status,
        assignedTo: c.assignedTo || null,
        date: new Date(c.filedAt).toISOString().split("T")[0],
      }));
    } else {
      // Fallback demo complaints so the UI isn't empty
      complaintList = [
        { id: "TK-001", studentName: "Amit Kumar", room: "A-101", category: "WiFi / Internet", title: "WiFi not working in Block A", priority: "High", status: "Open", assignedTo: "Mr. Sharma", date: "2025-03-10" },
        { id: "TK-002", studentName: "Neha Sharma", room: "C-304", category: "Plumbing / Water", title: "Water leakage in bathroom", priority: "Urgent", status: "In Progress", assignedTo: "Mr. Patel", date: "2025-03-09" },
        { id: "TK-003", studentName: "Rahul Singh", room: "B-205", category: "Electrical", title: "Fan not working", priority: "Medium", status: "Open", assignedTo: null, date: "2025-03-08" },
        { id: "TK-004", studentName: "Priya Jain", room: "A-203", category: "Furniture", title: "Broken chair needs replacement", priority: "Low", status: "Resolved", assignedTo: "Mr. Kumar", date: "2025-03-05" },
        { id: "TK-005", studentName: "Vikram Rao", room: "B-110", category: "Cleaning", title: "Common area not cleaned", priority: "Medium", status: "Open", assignedTo: null, date: "2025-03-07" },
      ];
    }

    const complaintsForStats = complaintList;
    const payload = {
      overviewStats: {
        totalCapacity: 1200,
        currentOccupancy: 950,
        availableRooms: 125,
        maintenanceRequests: complaintsForStats.filter(c => c.status === "Open").length
      },
      occupancyTrend: [
        { month: "Aug", occupancy: 850, capacity: 1200 },
        { month: "Sep", occupancy: 920, capacity: 1200 },
        { month: "Oct", occupancy: 950, capacity: 1200 },
        { month: "Nov", occupancy: 945, capacity: 1200 },
        { month: "Dec", occupancy: 900, capacity: 1200 },
      ],
      messMenu: [
        { day: 'Monday', breakfast: 'Poha, Jalebi', lunch: 'Rajma Chawal', snacks: 'Samosa', dinner: 'Paneer Butter Masala' },
        { day: 'Tuesday', breakfast: 'Idli Sambar', lunch: 'Chole Bhature', snacks: 'Bread Pakora', dinner: 'Dal Makhani' },
        { day: 'Wednesday', breakfast: 'Aloo Paratha', lunch: 'Kadhi Pakora', snacks: 'Patties', dinner: 'Egg Curry / Paneer Bhurji' },
      ],
      activeComplaints: complaintList,
      complaintStats: {
        total: complaintsForStats.length,
        resolved: complaintsForStats.filter(c => c.status === "Resolved").length,
        pending: complaintsForStats.filter(c => c.status === "Open").length,
        inProgress: complaintsForStats.filter(c => c.status === "In Progress").length,
        categoryBreakdown: [
          { category: "WiFi", count: complaintsForStats.filter(c => c.category === "WiFi / Internet").length || 15 },
          { category: "Plumbing", count: complaintsForStats.filter(c => c.category === "Plumbing / Water").length || 24 },
          { category: "Electrical", count: complaintsForStats.filter(c => c.category === "Electrical").length || 12 },
          { category: "Cleaning", count: complaintsForStats.filter(c => c.category === "Cleaning").length || 8 },
        ]
      },
      hostelRooms: [
        { id: '1', room: 'A-101', block: 'A', capacity: 2, occupied: 2, status: 'Full', amenities: ['AC', 'Attached Bath'] },
        { id: '2', room: 'A-102', block: 'A', capacity: 2, occupied: 1, status: 'Available', amenities: ['AC', 'Attached Bath'] },
        { id: '3', room: 'B-205', block: 'B', capacity: 3, occupied: 3, status: 'Full', amenities: ['Non-AC', 'Common Bath'] },
        { id: '4', room: 'C-304', block: 'C', capacity: 1, occupied: 1, status: 'Full', amenities: ['AC', 'Attached Bath'] },
        { id: '5', room: 'B-206', block: 'B', capacity: 3, occupied: 0, status: 'Available', amenities: ['Non-AC', 'Common Bath'] },
      ],
      visitors: [
        { id: 'V101', name: 'Rajesh Kumar', relation: 'Father', studentName: 'Amit Kumar', room: 'A-101', checkIn: '09:30 AM', checkOut: '11:45 AM', status: 'Checked Out' },
        { id: 'V102', name: 'Sunita Sharma', relation: 'Mother', studentName: 'Neha Sharma', room: 'C-304', checkIn: '10:15 AM', checkOut: '--', status: 'Inside' },
        { id: 'V103', name: 'Vikram Singh', relation: 'Brother', studentName: 'Rahul Singh', room: 'B-205', checkIn: '02:00 PM', checkOut: '--', status: 'Inside' },
      ]
    };

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error("Hostel Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
