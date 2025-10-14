import { Request, Response } from "express";
import prisma from "../prisma";

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Laporan penjualan dan pendapatan
 */

/**
 * @swagger
 * /reports/top-products:
 *   get:
 *     summary: Dapatkan produk terlaris
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: "Jumlah produk teratas yang ingin ditampilkan (default: 5)"
 *     responses:
 *       200:
 *         description: Daftar produk terlaris berdasarkan jumlah transaksi sukses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   totalSold:
 *                     type: integer
 */
export const getTopSellingProducts = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const topProducts = await prisma.transactionDigiflazz.groupBy({
      by: ["productId"],
      where: { status: "SUCCESS" },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: limit,
    });

    const result = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          productId: item.productId,
          name: product?.name || "Produk tidak diketahui",
          totalSold: item._count.productId,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch top selling products" });
  }
};

/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     summary: Dapatkan laporan pendapatan
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: "Tanggal mulai (yyyy-mm-dd)"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: "Tanggal akhir (yyyy-mm-dd)"
 *     responses:
 *       200:
 *         description: Total pendapatan dan laba bersih
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 totalProfit:
 *                   type: number
 *                 totalTransactions:
 *                   type: integer
 */
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause: any = { status: "SUCCESS" };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const transactions = await prisma.transactionDigiflazz.findMany({
      where: whereClause,
      include: { product: true },
    });

    const totalRevenue = transactions.reduce(
      (sum, trx) => sum + trx.product.selling_price,
      0
    );

    const totalProfit = transactions.reduce(
      (sum, trx) => sum + (trx.product.selling_price - trx.product.base_price),
      0
    );

    res.json({
      totalRevenue,
      totalProfit,
      totalTransactions: transactions.length,
      period:
        startDate && endDate
          ? `${startDate} → ${endDate}`
          : "Semua periode (All Time)",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate revenue report" });
  }
};

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Data gabungan untuk dashboard (chart & ringkasan)
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         required: false
 *         description: "Jumlah hari terakhir yang ingin ditampilkan (default: 7)"
 *     responses:
 *       200:
 *         description: Data laporan gabungan siap pakai untuk chart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                     totalProfit:
 *                       type: number
 *                     totalTransactions:
 *                       type: integer
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       totalSold:
 *                         type: integer
 *                 dailyRevenue:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       totalRevenue:
 *                         type: number
 */
export const getDashboardReport = async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const transactions = await prisma.transactionDigiflazz.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { product: true },
    });

    const totalProfit = transactions.reduce(
      (sum, trx) => sum + (trx.product.selling_price - trx.product.base_price),
      0
    );

    const totalRevenue = transactions.reduce(
      (sum, trx) => sum + trx.product.selling_price,
      0
    );

    const productSales: Record<string, number> = {};
    transactions.forEach((trx) => {
      const name = trx.product.name;
      productSales[name] = (productSales[name] || 0) + 1;
    });

    const topProducts = Object.entries(productSales)
      .map(([name, totalSold]) => ({ name, totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    const dailyMap: Record<string, number> = {};
    transactions.forEach((trx: any) => {
      const createdAt = trx.createdAt ?? new Date();
      const dateKey = createdAt.toISOString().split("T")[0];
      dailyMap[dateKey] =
        (dailyMap[dateKey] || 0) + (trx.product?.selling_price || 0);
    });

    const dailyRevenue = Object.entries(dailyMap)
      .map(([date, totalRevenue]) => ({ date, totalRevenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      summary: {
        totalRevenue,
        totalProfit,
        totalTransactions: transactions.length,
        period: `${startDate.toISOString().split("T")[0]} → ${
          endDate.toISOString().split("T")[0]
        }`,
      },
      topProducts,
      dailyRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate dashboard report" });
  }
};
