import { Request, Response } from "express";
import { handleDigiflazzWebhook } from "../services/digiflazzService";
import prisma from "../prisma";

/**
 * @swagger
 * tags:
 *   name: Digiflazz
 *   description: Endpoint integrasi Digiflazz (Webhook & Price List)
 */

/**
 * @swagger
 * /transactions/webhook/digiflazz:
 *   post:
 *     summary: Webhook callback dari Digiflazz (update status transaksi)
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ref_id:
 *                 type: string
 *                 example: "trx_123456789"
 *               status:
 *                 type: string
 *                 example: "SUCCESS"
 *               sn:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Callback berhasil diterima
 */
export const digiflazzWebhook = async (req: Request, res: Response) => {
  try {
    const { ref_id, status, sn } = req.body;

    const trx = await prisma.transactionDigiflazz.findUnique({
      where: { refId: ref_id },
    });

    if (!trx) return res.status(404).json({ error: "Transaction not found" });

    await prisma.transactionDigiflazz.update({
      where: { refId: ref_id },
      data: {
        status,
        sn: sn || trx.sn,
        rawResponse: JSON.stringify(req.body),
      },
    });

    res.json({ message: "Webhook processed successfully" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};
