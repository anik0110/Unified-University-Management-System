import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  code: string;
  name: string;
  credits: number;
  type: "Core" | "Elective";
  program: string;
  semester: number;
  facultyId: mongoose.Types.ObjectId;
  enrolledStudents: mongoose.Types.ObjectId[];
}

const courseSchema = new Schema<ICourse>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    type: { type: String, enum: ["Core", "Elective"], default: "Core" },
    program: { type: String, required: true },
    semester: { type: Number, required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "User" },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Course = mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);
