import express from "express";
import cors from "cors";
import helmet from "helmet";
import { uploadImage } from "./middleware/upload.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NutriScan AI server is running!",
  });
});

// TEMPORARY: remove when the real analyze route exists
app.post("/api/analyze", uploadImage, (req, res) => {
  res.json({ ok: true, type: req.file.detectedType, bytes: req.file.size });
});

export default app;