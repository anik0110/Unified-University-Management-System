import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  key: "library" | "finance" | "fest";
  value: any;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: { 
      type: String, 
      required: true, 
      unique: true,
      enum: ["library", "finance", "fest"]
    },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Setting = mongoose.models.Setting || mongoose.model<ISetting>("Setting", settingSchema);
