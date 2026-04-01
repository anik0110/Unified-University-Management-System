import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceRecord {
  studentId: mongoose.Types.ObjectId;
  status: "Present" | "Absent" | "Late";
}

export interface IAttendance extends Document {
  courseId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  date: Date;
  records: IAttendanceRecord[];
}

const attendanceSchema = new Schema<IAttendance>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    records: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["Present", "Absent", "Late"], required: true },
      },
    ],
  },
  { timestamps: true }
);

// Compound index to prevent duplicate attendance for same course+date
attendanceSchema.index({ courseId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", attendanceSchema);
