    import fs from "fs";
    import path from "path";
    import ExcelJS from "exceljs";
    import pgCopyStreams from "pg-copy-streams";
    import { pool } from "../src/db.js";

    const { from: copyFrom } = pgCopyStreams;

    /* helper */
    const waitFinish = (stream) =>
    new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });

    /* =================================
    GET ALL
    ================================= */
    export const getAllPPG = async (req, res) => {
    try {
        const { rows } = await pool.query(`
        SELECT * FROM data_ppg
        ORDER BY nama_lengkap ASC
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
    };

    /* =================================
    SEARCH
    ================================= */
        export const searchPPG = async (req, res) => {
    try {
        const q = req.query.keyword?.trim();

        if (!q || q.length < 2) {
        return res.json([]);
        }

        const result = await pool.query(
        `
        SELECT *
        FROM data_ppg
        WHERE nama_lengkap ~* $1
        ORDER BY nama_lengkap
        LIMIT 100
        `,
        [`\\m${q}\\M`]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
    };




    /* =================================
    DELETE ALL
    ================================= */
    export const deleteAllPPG = async (req, res) => {
    try {
        await pool.query(`TRUNCATE TABLE data_ppg RESTART IDENTITY`);

        res.json({ message: "Semua data PPG berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
    };

    /* =================================
    UPLOAD PPG
    ================================= */
    export const uploadPPG = async (req, res) => {
    const filePath = req.file?.path;

    if (!filePath)
        return res.status(400).json({ message: "File wajib diupload" });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const client = await pool.connect();
    const tempCsv = ext === ".xlsx" ? filePath + ".csv" : filePath;

    try {
        /* XLSX → CSV */
        if (ext === ".xlsx") {
        const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath);
        const csv = fs.createWriteStream(tempCsv);

        for await (const sheet of workbook) {
            let headers = [];

            for await (const row of sheet) {
            if (row.number === 1) {
                headers = row.values
                .slice(1)
                .map((h) =>
                    String(h)
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                );

                csv.write(headers.join(",") + "\n");
                continue;
            }

            const line = headers
                .map((_, i) => {
                const cell = row.getCell(i + 1).value ?? "";
                return `"${String(cell).replace(/"/g, '""')}"`;
                })
                .join(",");

            csv.write(line + "\n");
            }
            break;
        }

        csv.end();
        await waitFinish(csv);
        }

        /* COPY */
        await client.query("BEGIN");

        await client.query(`
        CREATE TEMP TABLE ppg_staging
        (LIKE data_ppg INCLUDING DEFAULTS)
        `);

        const copyStream = client.query(
        copyFrom(`
            COPY ppg_staging
            FROM STDIN
            WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')
        `)
        );

        fs.createReadStream(tempCsv).pipe(copyStream);
        await waitFinish(copyStream);

        /* UPSERT */
        await client.query(`
        INSERT INTO data_ppg
        SELECT DISTINCT ON (no_ukg) *
        FROM ppg_staging
        ORDER BY no_ukg
        ON CONFLICT (no_ukg)
        DO UPDATE SET
            nama_lengkap              = EXCLUDED.nama_lengkap,
            no_hp                     = EXCLUDED.no_hp,
            nama_sekolah              = EXCLUDED.nama_sekolah,
            npsn_sekolah              = EXCLUDED.npsn_sekolah,
            jenjang_sekolah           = EXCLUDED.jenjang_sekolah,
            provinsi_sekolah          = EXCLUDED.provinsi_sekolah,
            kota_kab_sekolah          = EXCLUDED.kota_kab_sekolah,
            status_kesediaan          = EXCLUDED.status_kesediaan,
            waktu_isi_kesediaan       = EXCLUDED.waktu_isi_kesediaan,
            kode_bs_ppg               = EXCLUDED.kode_bs_ppg,
            bidang_studi_ppg          = EXCLUDED.bidang_studi_ppg,
            lptk                      = EXCLUDED.lptk,
            status_plotting           = EXCLUDED.status_plotting,
            alasan                    = EXCLUDED.alasan,
            status_konfirmasi_email   = EXCLUDED.status_konfirmasi_email,
            waktu_konfirmasi_email    = EXCLUDED.waktu_konfirmasi_email,
            email_konfirmasi          = EXCLUDED.email_konfirmasi,
            tahap                     = EXCLUDED.tahap
        `);

        await client.query("COMMIT");

        fs.unlinkSync(filePath);
        ext === ".xlsx" && fs.unlinkSync(tempCsv);

        res.json({ message: "Upload data PPG berhasil" });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
    };
