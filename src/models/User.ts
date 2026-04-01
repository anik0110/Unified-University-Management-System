import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  extraRoles: string[];
  walletBalance: number;
  avatar?: string;
  otp?: string;
  otpExpiry?: Date;
  profileId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      required: true,
      enum: ["student", "professor", "hod", "dean", "director", "hostel_warden", "chief_warden", "hostel_supervisor", "accountant", "fest_coordinator", "librarian", "super_admin"]
    },
    extraRoles: [{ 
      type: String, 
      enum: ["hostel_warden", "chief_warden", "hostel_supervisor", "fest_coordinator", "librarian"]
    }],
    walletBalance: { type: Number, default: 0 },
    avatar: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    profileId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
