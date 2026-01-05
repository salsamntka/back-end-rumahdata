import express from "express";
import { getPTK, getSekolah, deleteAllPtk, deleteAllSekolah } from "../controllers/csvController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = express.Router();

router.get("/ptk", authenticateToken, getPTK);
router.delete("/ptk", authenticateToken, deleteAllPtk);
router.get("/sekolah", authenticateToken, getSekolah);
router.delete("/sekolah", authenticateToken, deleteAllSekolah);

export default router;
