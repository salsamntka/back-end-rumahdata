    import express from "express";
    import fs from "fs";
    import multer from "multer";

    import {
    getAllPPG,
    uploadPPG,
    deleteAllPPG,
    searchPPG,
    } from "../controllers/ppgController.js";

    import { authenticateToken } from "../src/middleware/authMiddleware.js";

    const router = express.Router();

    /* ===============================
    BUAT FOLDER UPLOAD OTOMATIS
    ================================ */
    if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads", { recursive: true });
    }

    /* ===============================
    MULTER STORAGE
    ================================ */
    const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (_, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
    });

    const maxMB = Number(process.env.UPLOAD_MAX_MB || 200);

    const upload = multer({
    storage,
    limits: {
        fileSize: maxMB * 1024 * 1024, // default 200MB
    },
    });

    /* ===============================
    ROUTES PPG
    ================================ */

    // GET ALL
    router.get("/getAllPPG", authenticateToken, getAllPPG);

    // SEARCH
    router.get("/searchPPG", authenticateToken, searchPPG);

    // DELETE ALL
    router.delete("/deleteAllPPG", authenticateToken, deleteAllPPG);

    // UPLOAD FILE
    router.post(
    "/upload-ppg",
    authenticateToken,
    upload.single("file"),
    uploadPPG
    );

    export default router;
