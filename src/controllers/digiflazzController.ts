import { Request, Response } from "express";
import { getPriceList } from "../services/digiflazzService";
import prisma from "../prisma";

/**
 * @swagger
 * tags:
 *   name: Digiflazz
 *   description: Endpoint integrasi dengan Digiflazz
 */

/**
 * @swagger
 * /digiflazz/pricelist:
 *   get:
 *     summary: Ambil daftar harga produk dari Digiflazz
 *     tags: [Digiflazz]
 *     responses:
 *       200:
 *         description: Daftar harga produk PPOB dari Digiflazz
 *       500:
 *         description: Gagal mengambil price list
 */
export const fetchPriceList = async (req: Request, res: Response) => {
  try {
    const data = await getPriceList();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch price list" });
  }
};

/**
 * @swagger
 * /digiflazz/callback:
 *   post:
 *     summary: Callback dari Digiflazz (webhook status transaksi)
 *     tags: [Digiflazz]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ref_id
 *               - status
 *             properties:
 *               ref_id:
 *                 type: string
 *                 example: "trx_123456789"
 *               status:
 *                 type: string
 *                 example: "SUCCESS"
 *               sn:
 *                 type: string
 *                 example: "123456789012345"
 *     responses:
 *       200:
 *         description: Callback berhasil diterima
 *       500:
 *         description: Gagal memproses callback
 */
export const digiflazzCallback = async (req: Request, res: Response) => {
  try {
    const { ref_id, status, sn } = req.body;

    // Update transaksi sesuai ref_id
    await prisma.transactionDigiflazz.updateMany({
      where: { refId: ref_id },
      data: { status, sn },
    });

    // Kirim respon 200 agar Digiflazz tahu callback diterima
    res.status(200).json({ message: "Callback received" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process callback" });
  }
};
