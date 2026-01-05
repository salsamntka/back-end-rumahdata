import { pool } from "../src/db.js";
import jwt from "jsonwebtoken";

const getPTK = async (req, res) => {
  //validasi token udah di middleware
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT *
      FROM public.ptk
      ORDER BY ptk_id
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM public.ptk`;
    const [dataResult, countResult] = await Promise.all([pool.query(dataQuery, [limit, offset]), pool.query(countQuery)]);
    const totalData = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalData / limit);

    res.json({
      page,
      limit,
      totalData,
      totalPages,
      data: dataResult.rows,
    });
  } catch (err) {
    console.error("PTK ERROR:", err);
    res.status(500).json({ message: "Gagal memproses data PTK" });
  }
};

const getSekolah = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT *
      FROM public.data_sekolah
      ORDER BY sekolah_id
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) FROM public.data_sekolah
    `;

    const [dataResult, countResult] = await Promise.all([pool.query(dataQuery, [limit, offset]), pool.query(countQuery)]);

    const totalData = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalData / limit);

    res.json({
      page,
      limit,
      totalData,
      totalPages,
      data: dataResult.rows,
    });
  } catch (err) {
    console.error("SEKOLAH ERROR:", err);
    res.status(500).json({ message: "Gagal memproses data sekolah" });
  }
};

const deleteAllPtk = async (req, res) => {
  try {
    // Menggunakan TRUNCATE lebih cepat untuk menghapus semua data
    await pool.query("TRUNCATE TABLE public.ptk RESTART IDENTITY CASCADE");

    res.json({
      message: "Seluruh data PTK telah berhasil dihapus dan ID telah di-reset",
    });
  } catch (err) {
    console.error("DELETE ALL PTK ERROR:", err);
    res.status(500).json({ message: "Gagal menghapus semua data PTK" });
  }
};

const deleteAllSekolah = async (req, res) => {
  try {
    await pool.query("TRUNCATE TABLE public.data_sekolah RESTART IDENTITY CASCADE");

    res.json({
      message: "Seluruh data sekolah telah berhasil dihapus dan ID telah di-reset",
    });
  } catch (err) {
    console.error("DELETE ALL SEKOLAH ERROR:", err);
    res.status(500).json({ message: "Gagal menghapus semua data sekolah" });
  }
};

// Update export
export { getPTK, getSekolah, deleteAllPtk, deleteAllSekolah };
