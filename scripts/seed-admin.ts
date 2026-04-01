/**
 * Seed script to create the default admin account.
 * Run with: npx tsx scripts/seed-admin.ts
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Define User schema inline to avoid import issues with Next.js modules
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  avatar: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
  profileId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB");

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    const adminEmail = "admin@university.ac.in";
    const adminPassword = "123456";

    // Check if admin already exists
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log("ℹ️  Admin account already exists. Skipping.");
      await mongoose.disconnect();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: "University Admin",
      email: adminEmail,
      passwordHash,
      role: "super_admin",
    });

    console.log("✅ Admin account created successfully!");
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     super_admin`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
