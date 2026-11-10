import "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => console.log(`NutriScan AI server running on port ${PORT}`));
} catch (err) {
  console.error("Startup failed:", err.message);
  process.exit(1);
}