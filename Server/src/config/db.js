import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}