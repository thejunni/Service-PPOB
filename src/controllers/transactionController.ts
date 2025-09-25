import { Request, Response } from "express";
import prisma from "../prisma";
import { createOrder } from "../services/digiflazzService";

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Endpoint untuk transaksi PPOB Digiflazz
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
  const transactions = await prisma.transactionDigiflazz.findMany({
    include: { user: true, product: true },
  });
  res.json(transactions);
};

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Buat transaksi manual (tidak order ke Digiflazz)
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
 *               - customerNo
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               productId:
 *                 type: integer
 *                 example: 2
 *               customerNo:
 *                 type: string
 *                 example: "081234567890"
 *     responses:
 *       201:
 *         description: Transaksi berhasil dibuat
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, productId, customerNo } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const refId = `TX-${Date.now()}`;

    const transaction = await prisma.transactionDigiflazz.create({
      data: {
        refId,
        buyerSkuCode: product.idProvider,
        customerNo,
        status: "PENDING",
        rawResponse: "{}",
        user: { connect: { id: userId } },
        product: { connect: { id: productId } },
      },
      include: { user: true, product: true },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update status transaksi manual
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

  const transaction = await prisma.transactionDigiflazz.update({
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
 *               - userId
 *               - productId
 *               - customerNo
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               productId:
 *                 type: integer
 *                 example: 2
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
    const { userId, productId, customerNo } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const refId = `trx_${Date.now()}`;

    // Simpan transaksi ke DB dengan status PENDING
    const trx = await prisma.transactionDigiflazz.create({
      data: {
        refId,
        buyerSkuCode: product.idProvider,
        customerNo,
        status: "PENDING",
        rawResponse: "{}",
        user: { connect: { id: userId } },
        product: { connect: { id: productId } },
      },
    });

    // Kirim order ke Digiflazz
    const digiflazzResponse = await createOrder(
      product.idProvider,
      customerNo,
      refId
    );

    // Update status awal sesuai response Digiflazz
    await prisma.transactionDigiflazz.update({
      where: { id: trx.id },
      data: {
        status: digiflazzResponse.data?.status || "PENDING",
        rawResponse: JSON.stringify(digiflazzResponse),
      },
    });

    res.json({ message: "Order processed", digiflazzResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to order product" });
  }
};
