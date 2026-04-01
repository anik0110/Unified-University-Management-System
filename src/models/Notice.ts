import mongoose, { Schema, Document } from "mongoose";

export interface INotice extends Document {
  title: string;
  content: string;
  category: string;
  isPublic: boolean;
  audienceRoles: string[]; // If empty, all roles. Otherwise, only specific roles (e.g. ['student'])
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    isPublic: { type: Boolean, default: false }, // If true, show on landing page
    audienceRoles: [{ type: String }],
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Notice = mongoose.models.Notice || mongoose.model<INotice>("Notice", noticeSchema);
