import { Request, Response } from "express";
import prisma from "../prisma";

/**
 * @swagger
 * tags:
 *   name: Branch
 *   description: Manajemen data cabang koperasi
 */

/**
 * @swagger
 * /branch:
 *   get:
 *     summary: Ambil semua branch (cabang koperasi)
 *     tags: [Branch]
 *     responses:
 *       200:
 *         description: Daftar semua cabang koperasi
 */
export const getAllBranch = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      include: { nasabah: true },
    });
    res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch branches" });
  }
};

/**
 * @swagger
 * /branch/{id}:
 *   get:
 *     summary: Ambil detail branch berdasarkan ID
 *     tags: [Branch]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail branch ditemukan
 *       404:
 *         description: Branch tidak ditemukan
 */
export const getBranchById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { nasabah: true },
    });
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch branch" });
  }
};

/**
 * @swagger
 * /branch:
 *   post:
 *     summary: Tambah branch baru
 *     tags: [Branch]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Koperasi Cabang Jakarta"
 *               address:
 *                 type: string
 *                 example: "Jl. Merdeka No. 12"
 *     responses:
 *       201:
 *         description: Branch berhasil dibuat
 */
export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, address } = req.body;
    const branch = await prisma.branch.create({
      data: { name, address },
    });
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ message: "Failed to create branch" });
  }
};

/**
 * @swagger
 * /branch/{id}:
 *   put:
 *     summary: Update data branch
 *     tags: [Branch]
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
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Branch berhasil diperbarui
 *       404:
 *         description: Branch tidak ditemukan
 */
export const updateBranch = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, address } = req.body;

    const branch = await prisma.branch.update({
      where: { id },
      data: { name, address },
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: "Failed to update branch" });
  }
};

/**
 * @swagger
 * /branch/{id}:
 *   delete:
 *     summary: Hapus branch
 *     tags: [Branch]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Branch berhasil dihapus
 *       404:
 *         description: Branch tidak ditemukan
 */
export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.branch.delete({ where: { id } });
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete branch" });
  }
};

/**
 * @swagger
 * /branch/{id}/nasabah:
 *   get:
 *     summary: Ambil semua nasabah berdasarkan cabang tertentu
 *     tags: [Branch]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID cabang
 *     responses:
 *       200:
 *         description: Daftar nasabah dari cabang yang diminta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 branch:
 *                   type: string
 *                   example: "Cabang Utama"
 *                 totalNasabah:
 *                   type: integer
 *                   example: 3
 *                 nasabah:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Budi Santoso"
 *                       saldo:
 *                         type: number
 *                         example: 500000
 *                       branchId:
 *                         type: integer
 *                         example: 1
 *       404:
 *         description: Cabang tidak ditemukan
 *       500:
 *         description: Gagal mengambil data nasabah cabang
 */
export const getNasabahByBranch = async (req: Request, res: Response) => {
  try {
    const branchId = Number(req.params.id);
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { nasabah: true },
    });

    if (!branch) {
      return res.status(404).json({ message: "Cabang tidak ditemukan" });
    }

    res.json({
      branch: branch.name,
      totalNasabah: branch.nasabah.length,
      nasabah: branch.nasabah,
    });
  } catch (err: any) {
    res.status(500).json({
      message: "Gagal mengambil data nasabah cabang",
      error: err.message,
    });
  }
};
