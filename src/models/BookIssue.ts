import mongoose, { Schema, Document } from "mongoose";

export interface IBookIssue extends Document {
  bookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  issuedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  fine: number;
  status: "Active" | "Overdue" | "Returned";
}

const bookIssueSchema = new Schema<IBookIssue>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
    fine: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Overdue", "Returned"], default: "Active" },
  },
  { timestamps: true }
);

bookIssueSchema.index({ userId: 1, status: 1 });
bookIssueSchema.index({ bookId: 1 });

export const BookIssue = mongoose.models.BookIssue || mongoose.model<IBookIssue>("BookIssue", bookIssueSchema);
