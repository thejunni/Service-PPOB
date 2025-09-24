import { Request, Response } from "express";
import prisma from "../prisma";
import { createOrder } from "../services/digiFlazzService";

export const getTransactions = async (req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    include: { user: true, product: true },
  });
  res.json(transactions);
};

export const createTransaction = async (req: Request, res: Response) => {
  const { userId, productId } = req.body;
  const transaction = await prisma.transaction.create({
    data: { userId, productId },
  });
  res.json(transaction);
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const transaction = await prisma.transaction.update({
    where: { id: Number(id) },
    data: { status },
  });
  res.json(transaction);
};

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