import "dotenv/config";

const required = [
  "MONGODB_URI",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "CLIENT_ORIGIN",
  "JWT_SECRET",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters long.");
  process.exit(1);
}