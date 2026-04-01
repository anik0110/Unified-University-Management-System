import mongoose, { Schema, Document } from "mongoose";

export interface IFestRegistration extends Document {
  userId: mongoose.Types.ObjectId;
  festType: "Technical" | "Cultural";
  transactionId: mongoose.Types.ObjectId;
  registeredAt: Date;
}

const festRegistrationSchema = new Schema<IFestRegistration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    festType: { 
      type: String, 
      required: true,
      enum: ["Technical", "Cultural"]
    },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A student can uniquely register for a specific fest type
festRegistrationSchema.index({ userId: 1, festType: 1 }, { unique: true });

export const FestRegistration = mongoose.models.FestRegistration || mongoose.model<IFestRegistration>("FestRegistration", festRegistrationSchema);
