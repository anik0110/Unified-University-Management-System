import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  publisher?: string;
  publishYear?: number;
  createdAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    totalCopies: { type: Number, required: true, default: 1 },
    availableCopies: { type: Number, required: true, default: 1 },
    shelfLocation: { type: String, required: true },
    publisher: { type: String },
    publishYear: { type: Number },
  },
  { timestamps: true }
);

bookSchema.index({ title: "text", author: "text", category: "text" });

export const Book = mongoose.models.Book || mongoose.model<IBook>("Book", bookSchema);
