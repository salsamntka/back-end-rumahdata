import { pool } from "../src/db.js";
export const tambahKegiatan = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      nama_kegiatan,
      tanggal_pelaksanaan,
      jumlah_peserta,
      pic,
      kelengkapan,
    } = req.body;

    // 🔐 dari token
    const user_id = req.user.id;
    const id_bidang = req.user.id_bidang;

    await client.query("BEGIN");

    const kegiatanResult = await client.query(
      `
      INSERT INTO kegiatan (
        nama_kegiatan,
        tanggal_pelaksanaan,
        jumlah_peserta,
        pic,
        user_id,
        id_bidang
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        nama_kegiatan,
        tanggal_pelaksanaan,
        jumlah_peserta,
        pic,
        user_id,
        id_bidang,
      ]
    );

    const kegiatanId = kegiatanResult.rows[0].id;

    await client.query(
      `
      INSERT INTO kelengkapan_kegiatan (
        kegiatan_id,
        foto,
        video,
        upload_laporan
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        kegiatanId,
        kelengkapan?.foto ?? false,
        kelengkapan?.video ?? false,
        kelengkapan?.upload_laporan ?? false,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Kegiatan berhasil ditambahkan",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Gagal menambahkan kegiatan" });
  } finally {
    client.release();
  }
};
