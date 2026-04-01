import mongoose, { Schema, Document } from "mongoose";

export interface IComplaint extends Document {
  ticketId: string;
  studentId: mongoose.Types.ObjectId;
  roomNo: string;
  category: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  description: string;
  status: "Open" | "In Progress" | "Resolved";
  assignedTo?: string;
  filedAt: Date;
  resolvedAt?: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    ticketId: { type: String, required: true, unique: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomNo: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    description: { type: String, required: true },
    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
    assignedTo: { type: String },
    filedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Complaint = mongoose.models.Complaint || mongoose.model<IComplaint>("Complaint", complaintSchema);
