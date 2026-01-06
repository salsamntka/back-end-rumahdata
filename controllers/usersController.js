import { pool } from "../src/db.js";

const getUsersList = async (req, res) => {
  try {
    const query = `
        SELECT 
            id,
            nip,
            nama,
            role,
            status
        FROM users
        ORDER BY id ASC
        `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data users",
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const { id_user, role, status } = req.body;

    //Ambil data user dari database
    const currentUser = await pool.query("SELECT role, status FROM users WHERE id = $1", [id_user]);

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    //nilai dari body, kalau kosong gunakan nilai lama
    let newRole = role || currentUser.rows[0].role;
    let newStatus = status || currentUser.rows[0].status;

    //Validasi sebelum masuk ke DB
    if (newRole && !["admin", "user"].includes(newRole)) {
      return res.status(400).json({ error: "Role tidak valid" });
    }
    if (newStatus && !["pending", "approved"].includes(newStatus)) {
      return res.status(400).json({ error: "Status tidak valid" });
    }

    //Update
    const result = await pool.query(
      `UPDATE users 
       SET role = $1, status = $2
       WHERE id = $3
       RETURNING id, nip, nama, role, status`,
      [newRole, newStatus, id_user]
    );

    res.json({
      message: "Data user berhasil diperbarui",
      user: result.rows[0],
      autoApproved: role === "admin", // Memberitahu frontend jika terjadi auto-approve
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "server error" });
  }
};

export { getUsersList, approveUser };
