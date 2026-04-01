import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  payeeId?: mongoose.Types.ObjectId;
  amount: number;
  type: "Fest" | "Library" | "Tuition" | "Residence" | "Wallet Deposit" | "Refund";
  description: string;
  status: "Success" | "Failed" | "Pending";
  stripeSessionId?: string; // For future Real PG integration
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    payeeId: { type: Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ["Fest", "Library", "Tuition", "Residence", "Wallet Deposit", "Refund"]
    },
    description: { type: String, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ["Success", "Failed", "Pending"],
      default: "Success"
    },
    stripeSessionId: { type: String },
  },
  { timestamps: true }
);

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", transactionSchema);
