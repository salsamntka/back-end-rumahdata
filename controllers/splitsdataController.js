import ExcelJS from "exceljs";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";

export const splitsData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }
    const rowsPerFile = 1000;
    const filePath = req.file.path;

    const cleanup = () => {
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Gagal hapus file:", err);
        });
      }
    };

    res.on("close", cleanup);
    res.on("finish", cleanup);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=split_results.zip",
    );

    const archive = archiver("zip", { zlib: { level: 1 } });
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Gagal membuat zip" });
      }
    });

    archive.pipe(res);

    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath);

    let headers = [];
    let rowCount = 0;
    let fileIndex = 1;

    let passThrough;
    let workbookWriter;
    let worksheetWriter;

    for await (const worksheet of workbookReader) {
      for await (const row of worksheet) {
        if (row.number === 1) {
          headers = row.values.slice(1);
          continue;
        }

        if (rowCount % rowsPerFile === 0) {
          if (workbookWriter) {
            await workbookWriter.commit();
          }

          passThrough = new PassThrough();

          archive.append(passThrough, {
            name: `ptk_${fileIndex}.xlsx`,
          });

          workbookWriter = new ExcelJS.stream.xlsx.WorkbookWriter({
            stream: passThrough,
          });

          worksheetWriter = workbookWriter.addWorksheet("Sheet1");
          worksheetWriter.addRow(headers).commit();

          fileIndex++;
        }

        worksheetWriter.addRow(row.values.slice(1)).commit();
        rowCount++;
      }
    }

    if (workbookWriter) {
      await workbookWriter.commit();
    }

    await archive.finalize();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
