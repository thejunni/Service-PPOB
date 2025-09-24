# 🚀 PPOB Service with Digiflazz Integration

Proyek ini adalah backend service untuk **PPOB (Payment Point Online Banking)** berbasis **Node.js (Express + TypeScript)** dengan **Prisma ORM**.  
Mendukung **autentikasi JWT (login/logout)**, manajemen user, produk, transaksi, serta integrasi ke **API Digiflazz** termasuk **webhook callback**.

---

## 📌 Fitur Utama
- ✅ **Autentikasi User**
  - Login / Logout dengan JWT & Refresh Token
  - Role `USER` & `ADMIN`
- ✅ **Produk**
  - Menyimpan daftar produk (idProvider, kategori, harga)
- ✅ **Transaksi PPOB**
  - Create transaksi ke Digiflazz
  - Simpan status awal (`PENDING`)
  - Update status otomatis via **webhook Digiflazz**
- ✅ **Webhook Digiflazz**
  - Endpoint `POST /api/digiflazz/webhook`
  - Update transaksi (SUCCESS / FAILED) otomatis
- ✅ **Prisma ORM**
  - MySQL (atau PostgreSQL/SQLite)
- ✅ **TypeScript + Express**

---

## 🛠️ Tech Stack
- [Node.js](https://nodejs.org/) (v18+)
- [Express](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [MySQL](https://www.mysql.com/) (default DB, bisa pakai PostgreSQL)
- [JWT](https://jwt.io/) (auth)
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) (hash password)
