import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  enrollmentNo: string;
  course: string;
  branch: string;
  semester: number;
  section: string;
  admissionYear: number;
  contactNo: string;
  bloodGroup: string;
  parentContact: string;
  address: string;
  cgpa: number;
  sgpa: number;
  hostelDetails?: {
    block: string;
    roomNo: string;
  };
  feeDetails: any;
  notifications: any[];
}

const studentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrollmentNo: { type: String, required: true, unique: true },
    course: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true, default: 1 },
    section: { type: String, required: true },
    admissionYear: { type: Number, required: true },
    contactNo: { type: String, required: true },
    bloodGroup: { type: String, default: "Unknown" },
    parentContact: { type: String, default: "" },
    address: { type: String, default: "" },
    cgpa: { type: Number, default: 0 },
    sgpa: { type: Number, default: 0 },
    hostelDetails: {
      block: { type: String, default: "" },
      roomNo: { type: String, default: "" },
    },
    feeDetails: {
      type: Schema.Types.Mixed,
      default: {
        totalFee: 0,
        paid: 0,
        pending: 0,
        dueDate: "",
        installments: [],
        breakdown: [],
      },
    },
    notifications: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export const Student = mongoose.models.Student || mongoose.model<IStudent>("Student", studentSchema);
