import { google } from "googleapis";
import stream from "stream";
import path from "path";
import { fileURLToPath } from "url";

// Setup Auth GDrive
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYFILEPATH = path.join(__dirname, "../service-account.json"); // Path ke file json

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const driveService = google.drive({ version: "v3", auth });
const FOLDER_ID = "MASUKKAN_ID_FOLDER_GDRIVE_DISINI";

// Fungsi Helper Upload
export const uploadToDrive = async (fileObject) => {
  if (!fileObject) return { link: null, id: null }; // Return null jika file tidak ada

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    const { data } = await driveService.files.create({
      media: {
        mimeType: fileObject.mimetype,
        body: bufferStream,
      },
      requestBody: {
        name: `${Date.now()}-${fileObject.originalname}`, // Rename biar unik
        parents: [FOLDER_ID],
      },
      fields: "id, webViewLink",
    });

    return { link: data.webViewLink, id: data.id };
  } catch (error) {
    console.error("GDrive Upload Error:", error);
    throw new Error("Gagal upload ke Google Drive");
  }
};
