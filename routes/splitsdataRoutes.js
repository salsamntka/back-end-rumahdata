import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";
import fs from "fs";

import { splitsData } from "../controllers/splitsdataController.js";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file .xlsx"));
    }
  },
});

router.post("/upload", upload.single("file"), splitsData);

export default router;
