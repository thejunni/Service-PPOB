import express, { Request, Response } from "express";
import prisma from "../prisma";

const router = express.Router();

/**
 * Digiflazz Webhook Endpoint
 * URL harus kamu daftarkan di Digiflazz Dashboard
 */
router.post("/digiflazz/webhook", async (req: Request, res: Response) => {
  try {
    const data = req.body;

    /**
     * Contoh payload dari Digiflazz:
     * {
     *   "ref_id": "INV12345",
     *   "status": "Sukses",
     *   "buyer_sku_code": "xld5k",
     *   "customer_no": "08123456789",
     *   "sn": "123456789012",
     *   "message": "Transaksi berhasil"
     * }
     */

    if (!data.ref_id) {
      return res.status(400).json({ message: "Missing ref_id" });
    }

    const trx = await prisma.transactionDigiflazz.findUnique({
      where: { refId: data.ref_id },
    });

    if (!trx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Update transaksi sesuai webhook
    await prisma.transactionDigiflazz.update({
      where: { refId: data.ref_id },
      data: {
        status: data.status?.toUpperCase() || "UNKNOWN",
        sn: data.sn || "",
        rawResponse: JSON.stringify(data),
        updatedAt: new Date(),
      },
    });

    // balikan response ke Digiflazz
    return res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
