import express from "express";
import { requireAuth } from "../middleware/auth.ts";
import {
  getUserPan,
  saveUserPan,
} from "../controllers/userPan.controller.ts";

const router = express.Router();

router.get("/user/pan", requireAuth, getUserPan);
router.post("/user/pan", requireAuth, saveUserPan);

export default router;
