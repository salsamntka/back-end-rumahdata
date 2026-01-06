import express from "express";
import { addKegiatan } from "../controllers/kegiatanController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = express.Router();

router.post("/kegiatan", authenticateToken, addKegiatan);
export default router;
