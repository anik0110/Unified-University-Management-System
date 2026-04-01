import mongoose, { Schema, Document } from "mongoose";

export interface IFaculty extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  department: string;
  designation: string;
  qualification: string;
  joiningDate: Date;
  contactNo: string;
  officeLocation: string;
  publications: number;
  experience: number;
  notifications: any[];
}

const facultySchema = new Schema<IFaculty>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    qualification: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    contactNo: { type: String, required: true },
    officeLocation: { type: String, default: "Main Academic Block" },
    publications: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    notifications: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export const Faculty = mongoose.models.Faculty || mongoose.model<IFaculty>("Faculty", facultySchema);
