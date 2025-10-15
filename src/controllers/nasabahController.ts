import { Request, Response } from "express";
import prisma from "../prisma";

/**
 * @swagger
 * tags:
 *   name: Nasabah
 *   description: Manajemen data nasabah koperasi
 */

/**
 * @swagger
 * /api/nasabah:
 *   get:
 *     summary: Ambil semua data nasabah
 *     tags: [Nasabah]
 *     responses:
 *       200:
 *         description: Daftar semua nasabah
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   saldo:
 *                     type: number
 *                   branchId:
 *                     type: integer
 */
export const getAllNasabah = async (req: Request, res: Response) => {
  try {
    const nasabahList = await prisma.nasabah.findMany({
      include: { branch: true },
    });
    res.json(nasabahList);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data nasabah", error: err.message });
  }
};

/**
 * @swagger
 * /api/nasabah/{id}:
 *   get:
 *     summary: Ambil detail nasabah berdasarkan ID
 *     tags: [Nasabah]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail nasabah ditemukan
 *       404:
 *         description: Nasabah tidak ditemukan
 */
export const getNasabahById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const nasabah = await prisma.nasabah.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!nasabah)
      return res.status(404).json({ message: "Nasabah tidak ditemukan" });

    res.json(nasabah);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data nasabah", error: err.message });
  }
};

/**
 * @swagger
 * /api/nasabah:
 *   post:
 *     summary: Tambahkan nasabah baru
 *     tags: [Nasabah]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - saldo
 *               - branchId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Budi Santoso"
 *               saldo:
 *                 type: number
 *                 example: 1000000
 *               branchId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Nasabah berhasil ditambahkan
 *       400:
 *         description: Data tidak valid
 */
export const createNasabah = async (req: Request, res: Response) => {
  try {
    const { name, balance, branchId, phone } = req.body;

    if (!name || branchId === undefined) {
      return res.status(400).json({ message: "Nama dan branchId wajib diisi" });
    }

    const branchExists = await prisma.branch.findUnique({
      where: { id: Number(branchId) },
    });

    if (!branchExists) {
      return res.status(404).json({ message: "Cabang tidak ditemukan" });
    }

    const nasabah = await prisma.nasabah.create({
      data: {
        name,
        balance: balance ?? 0,
        branchId: Number(branchId),
        phone,
      },
    });

    res.status(201).json(nasabah);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan nasabah", error: err.message });
  }
};

/**
 * @swagger
 * /api/nasabah/{id}:
 *   put:
 *     summary: Update data nasabah
 *     tags: [Nasabah]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               saldo:
 *                 type: number
 *               branchId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Data nasabah berhasil diperbarui
 *       404:
 *         description: Nasabah tidak ditemukan
 */
export const updateNasabah = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, balance, branchId } = req.body;

    const nasabahExists = await prisma.nasabah.findUnique({ where: { id } });
    if (!nasabahExists)
      return res.status(404).json({ message: "Nasabah tidak ditemukan" });

    const updatedNasabah = await prisma.nasabah.update({
      where: { id },
      data: { name, balance, branchId },
    });

    res.json(updatedNasabah);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui nasabah", error: err.message });
  }
};

/**
 * @swagger
 * /api/nasabah/{id}:
 *   delete:
 *     summary: Hapus nasabah berdasarkan ID
 *     tags: [Nasabah]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Nasabah berhasil dihapus
 *       404:
 *         description: Nasabah tidak ditemukan
 */
export const deleteNasabah = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const nasabah = await prisma.nasabah.findUnique({ where: { id } });
    if (!nasabah)
      return res.status(404).json({ message: "Nasabah tidak ditemukan" });

    await prisma.nasabah.delete({ where: { id } });
    res.json({ message: "Nasabah berhasil dihapus" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Gagal menghapus nasabah", error: err.message });
  }
};
