import { Request, Response } from "express";
import prisma from "../prisma";

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Produk PPOB dari Digiflazz
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Ambil semua produk
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Daftar produk PPOB
 */
export const getProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany();
  res.json(products);
};

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Tambah produk baru
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Pulsa 10K
 *               category:
 *                 type: string
 *                 example: Pulsa
 *               price:
 *                 type: number
 *                 example: 10500
 *     responses:
 *       200:
 *         description: Produk berhasil dibuat
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { idProvider, name, category, price } = req.body;

    if (!idProvider || !name || !category || !price) {
      return res
        .status(400)
        .json({ error: "idProvider, name, category, and price are required" });
    }

    const product = await prisma.product.create({
      data: { idProvider, name, category, price },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create product" });
  }
}

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update produk berdasarkan ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID produk
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Pulsa 20K
 *               category:
 *                 type: string
 *                 example: Pulsa
 *               price:
 *                 type: number
 *                 example: 20500
 *     responses:
 *       200:
 *         description: Produk berhasil diperbarui
 */
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, price } = req.body;
  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: { name, category, price },
  });
  res.json(product);
};
