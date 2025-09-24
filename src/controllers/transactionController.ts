import { Request, Response } from "express";
import prisma from "../prisma";
import { createOrder } from "../services/digiflazzService";

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Endpoint untuk transaksi PPOB
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Ambil semua transaksi
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Daftar transaksi
 */
export const getTransactions = async (req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    include: { user: true, product: true },
  });
  res.json(transactions);
};

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Buat transaksi baru (manual, bukan Digiflazz)
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               productId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Transaksi berhasil dibuat
 */
export const createTransaction = async (req: Request, res: Response) => {
  const { userId, productId } = req.body;
  const transaction = await prisma.transaction.create({
    data: { userId, productId },
  });
  res.json(transaction);
};

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update status transaksi
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID transaksi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: SUCCESS
 *     responses:
 *       200:
 *         description: Status transaksi berhasil diperbarui
 */
export const updateTransactionStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const transaction = await prisma.transaction.update({
    where: { id: Number(id) },
    data: { status },
  });
  res.json(transaction);
};

/**
 * @swagger
 * /transactions/order:
 *   post:
 *     summary: Buat order ke Digiflazz
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerSkuCode
 *               - customerNo
 *             properties:
 *               buyerSkuCode:
 *                 type: string
 *                 example: "pulsa10k"
 *               customerNo:
 *                 type: string
 *                 example: "081234567890"
 *     responses:
 *       200:
 *         description: Order berhasil diproses
 *       500:
 *         description: Gagal memproses order
 */
export const orderProduct = async (req: Request, res: Response) => {
  try {
    const { buyerSkuCode, customerNo } = req.body;

    // bikin refId unik
    const refId = `trx_${Date.now()}`;

    // Simpan transaksi di DB dengan status "PENDING"
    const trx = await prisma.transaction.create({
      data: {
        refId,
        buyerSkuCode,
        customerNo,
        status: "PENDING",
      },
    });

    // Request ke Digiflazz
    const digiflazzResponse = await createOrder(
      buyerSkuCode,
      customerNo,
      refId
    );

    // Update status berdasarkan respon awal Digiflazz
    await prisma.transaction.update({
      where: { id: trx.id },
      data: {
        status: digiflazzResponse.data.status || "PENDING",
        rawResponse: JSON.stringify(digiflazzResponse),
      },
    });

    res.json({ message: "Order processed", digiflazzResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to order product" });
  }
};
