import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  venue: string;
  isPublic: boolean;
  organizer: string;
  authorId: mongoose.Types.ObjectId;
  festType?: "Technical" | "Cultural" | "General";
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    organizer: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    festType: { 
      type: String, 
      enum: ["Technical", "Cultural", "General"],
      default: "General" 
    },
  },
  { timestamps: true }
);

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);
