import { Request, Response } from "express";
import prisma from "../prisma";
import { createOrder } from "../services/digiflazzService";
import axios from "axios";
import crypto from "crypto";

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
 * /transactions/{id}:
 *   get:
 *     summary: Ambil transaksi berdasarkan ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID transaksi
 *     responses:
 *       200:
 *         description: Data transaksi
 *       404:
 *         description: Transaksi tidak ditemukan
 */
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trx = await prisma.transactionDigiflazz.findUnique({
      where: { id: Number(id) },
      include: { user: true, product: true },
    });

    if (!trx) return res.status(404).json({ error: "Transaction not found" });

    res.json(trx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
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
 *               productId:
 *                 type: integer
 *               customerNo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaksi berhasil dibuat
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, productId, customerNo } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

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
 * /transactions/order:
 *   post:
 *     summary: Buat order ke Digiflazz (otomatis create transaction)
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
 *               productId:
 *                 type: integer
 *               customerNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order berhasil diproses dan transaksi tercatat
 *       500:
 *         description: Gagal memproses order
 */
export const orderProduct = async (req: Request, res: Response) => {
  try {
    const { userId, productId, customerNo } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const refId = `trx_${Date.now()}`;

    // --- 🔹 Generate signature SHA256 (username+apiKey+refId)
    const username = process.env.DIGIFLAZZ_USERNAME as string;
    const apiKey = process.env.DIGIFLAZZ_API_KEY as string;
    const sign = crypto
      .createHash("sha256")
      .update(username + apiKey + refId)
      .digest("hex");

    // --- 🔹 Payload sesuai dokumentasi Digiflazz
    const payload = {
      username,
      buyer_sku_code: product.idProvider,
      customer_no: customerNo,
      ref_id: refId,
      sign,
    };

    // --- 🔹 Simpan transaksi di DB status PENDING
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
      include: { user: true, product: true },
    });

    // --- 🔹 Kirim request ke Digiflazz
    const digiflazzResponse = await axios.post(
      "https://api.digiflazz.com/v1/transaction",
      payload
    );

    // --- 🔹 Update transaksi dengan status awal dari Digiflazz
    const updatedTrx = await prisma.transactionDigiflazz.update({
      where: { id: trx.id },
      data: {
        status: digiflazzResponse.data?.data?.status || "PENDING",
        rawResponse: JSON.stringify(digiflazzResponse.data),
      },
      include: { user: true, product: true },
    });

    res.json({
      message: "Order processed",
      transaction: updatedTrx,
      digiflazz: digiflazzResponse.data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to order product" });
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
  try {
    const { id } = req.params;
    const { status } = req.body;

    const transaction = await prisma.transactionDigiflazz.update({
      where: { id: Number(id) },
      data: { status },
      include: { user: true, product: true },
    });

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update transaction status" });
  }
};

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Failed to delete transaction
 */
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trx = await prisma.transactionDigiflazz.findUnique({
      where: { id: Number(id) },
    });

    if (!trx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await prisma.transactionDigiflazz.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};