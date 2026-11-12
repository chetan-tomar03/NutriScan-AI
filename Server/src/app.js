import express from "express";
import cors from "cors";
import helmet from "helmet";
import { uploadImage } from "./middleware/upload.js";
import { analyzeFoodImage, AIError } from "./services/foodAI.service.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/errorhandler.js";


const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());
app.use("/api/auth", authRoutes);

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NutriScan AI server is running!",
  });
});

app.post("/api/analyze", uploadImage, async (req, res, next) => {
  try {
    const result = await analyzeFoodImage(req.file.buffer, req.file.detectedType);
    res.json(result);
  } catch (err) {
    if (err instanceof AIError)
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

app.use(errorHandler);
export default app;