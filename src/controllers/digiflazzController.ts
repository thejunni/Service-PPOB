import { Request, Response } from "express";
import { getPriceList } from "../services/digiFlazzService";
import prisma from "../prisma";

export const fetchPriceList = async (req: Request, res: Response) => {
  try {
    const data = await getPriceList();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch price list" });
  }
};

export const digiflazzCallback = async (req: Request, res: Response) => {
  try {
    const { ref_id, status, sn } = req.body;

    // Update transaksi sesuai ref_id
    await prisma.transaction.updateMany({
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
