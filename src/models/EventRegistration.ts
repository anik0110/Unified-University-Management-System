import mongoose, { Schema, Document } from "mongoose";

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  festType: "Technical" | "Cultural";
  leaderId: mongoose.Types.ObjectId;
  teamMembers: mongoose.Types.ObjectId[];
  teamName?: string;
  registeredAt: Date;
}

const eventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    festType: {
      type: String,
      required: true,
      enum: ["Technical", "Cultural"],
    },
    leaderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    teamName: { type: String, default: "" },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A student can only register once per event (as leader)
eventRegistrationSchema.index({ eventId: 1, leaderId: 1 }, { unique: true });

export const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>("EventRegistration", eventRegistrationSchema);
