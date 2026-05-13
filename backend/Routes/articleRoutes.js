const express = require('express');
const router = express.Router();
const db = require('../db'); // Mundur 1 folder (..) untuk memanggil jembatan database

// ==========================================
// 1. ENDPOINT GET: MENGAMBIL SEMUA BERITA
// ==========================================
router.get('/', async (req, res) => {
    try {
        // Kita pakai JOIN agar nama Kategori dan Penulis ikut tampil, bukan cuma ID-nya saja!
        const query = `
            SELECT tbl_artikel.id, tbl_artikel.title, tbl_artikel.content, tbl_artikel.image, tbl_artikel.created_at,
                   tbl_category.name AS category_name, 
                   tbl_users.username AS author_name
            FROM tbl_artikel
            JOIN tbl_category ON tbl_artikel.category_id = tbl_category.id
            JOIN tbl_users ON tbl_artikel.user_id = tbl_users.id
            ORDER BY tbl_artikel.created_at DESC
        `;

        const [rows] = await db.query(query);
        res.json({ success: true, data: rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
});
// ==========================================
// 2. ENDPOINT POST: MENAMBAH BERITA BARU
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { title, content, image, category_id, user_id } = req.body;

        // Validasi sederhana
        if (!title || !content || !category_id || !user_id) {
            return res.status(400).json({ success: false, message: "Data tidak boleh kosong!" });
        }

        // Tanda '?' digunakan agar aman dari serangan Hacker (SQL Injection)
        const query = `INSERT INTO tbl_artikel (title, content, image, category_id, user_id) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(query, [title, content, image || 'default.jpg', category_id, user_id]);

        res.status(201).json({ success: true, message: "Berita berhasil ditambahkan!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        // 1. TANGKAP NOMOR ID DARI URL (Contoh: /api/articles/5 berarti ID-nya 5)
        const articleId = req.params.id;

        // 2. PERINTAHKAN DAPUR (MySQL) UNTUK MENGHAPUS
        const query = `DELETE FROM tbl_artikel WHERE id = ?`;
        const [result] = await db.query(query, [articleId]);

        // 3. CEK APAKAH BERITANYA BENERAN ADA?
        // affectedRows itu jumlah baris yang berhasil dihapus di database
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Gagal dihapus! Berita dengan ID tersebut tidak ditemukan."
            });
        }

        // 4. KABARI JIKA BERHASIL
        res.status(200).json({
            success: true,
            message: `Mantap! Berita nomor ${articleId} telah hangus tak tersisa.`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
});


module.exports = router;

// ==========================================
// 4. ENDPOINT PUT: MENGUPDATE BERITA
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        // Tangkap ID dari URL (contoh: /api/articles/1)
        const { id } = req.params;
        // Tangkap data baru dari body request
        const { title, content, image, category_id, user_id } = req.body;

        // Validasi sederhana
        if (!title || !content || !category_id || !user_id) {
            return res.status(400).json({ success: false, message: "Data tidak boleh kosong!" });
        }

        // Query UPDATE menggunakan tbl_artikel
        const query = `
            UPDATE tbl_artikel 
            SET title = ?, content = ?, image = ?, category_id = ?, user_id = ? 
            WHERE id = ?
        `;

        // Jalankan query (urutan variabel dalam array harus SAMA PERSIS dengan tanda '?' di atas)
        const [result] = await db.query(query, [title, content, image || 'default.jpg', category_id, user_id, id]);

        // Jika ID tidak ditemukan di database
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Berita tidak ditemukan!" });
        }

        res.json({ success: true, message: "Berita berhasil diupdate!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
});

