import { Router } from "express";
import { register, login, getMe, deleteMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.delete("/me", requireAuth, deleteMe);

export default router;