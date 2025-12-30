import express from "express";
import { tambahKegiatan } from "../controllers/kegiatanController.js";
import { verifyToken } from "../controllers/excelController.js";

const router = express.Router();

router.post("/kegiatan", verifyToken, tambahKegiatan);
export default router;
