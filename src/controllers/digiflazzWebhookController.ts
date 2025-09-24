import { Request, Response } from "express";
import { handleDigiflazzWebhook } from "../services/digiflazzService";

/**
 * @swagger
 * tags:
 *   name: Digiflazz
 *   description: Endpoint integrasi Digiflazz (Webhook & Price List)
 */

/**
 * @swagger
 * /digiflazz/webhook:
 *   post:
 *     summary: Webhook Digiflazz untuk update status transaksi
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
 *                 enum: [PENDING, SUCCESS, FAILED]
 *                 example: "SUCCESS"
 *               sn:
 *                 type: string
 *                 example: "123456789012345"
 *     responses:
 *       200:
 *         description: Webhook diterima dan diproses
 *       400:
 *         description: Gagal memproses webhook
 */
export async function digiflazzWebhook(req: Request, res: Response) {
  try {
    await handleDigiflazzWebhook(req.body);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
}
