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
 * /api/products:
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
 * /api/products/{id}:
 *   get:
 *     summary: Ambil detail produk berdasarkan ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Detail produk ditemukan
 *       404:
 *         description: Produk tidak ditemukan
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get product" });
  }
};

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idProvider
 *               - name
 *               - category
 *               - base_price
 *               - selling_price
 *             properties:
 *               idProvider:
 *                 type: string
 *                 example: "TS10"
 *               name:
 *                 type: string
 *                 example: "Pulsa Telkomsel 10.000"
 *               category:
 *                 type: string
 *                 example: "PULSA"
 *               base_price:
 *                 type: number
 *                 example: 10000
 *               selling_price:
 *                 type: number
 *                 example: 11500
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad Request
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { idProvider, name, category, base_price, selling_price } = req.body;

    if (!idProvider || !name || !category || !base_price || !selling_price) {
      return res.status(400).json({
        error:
          "idProvider, name, category, base_price, and selling_price are required",
      });
    }

    const profit = selling_price - base_price;

    const product = await prisma.product.create({
      data: {
        idProvider,
        name,
        category,
        base_price,
        selling_price,
        profit,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idProvider:
 *                 type: string
 *                 example: "TS20"
 *               name:
 *                 type: string
 *                 example: "Pulsa Telkomsel 20.000"
 *               category:
 *                 type: string
 *                 example: "PULSA"
 *               base_price:
 *                 type: number
 *                 example: 20000
 *               selling_price:
 *                 type: number
 *                 example: 21500
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Product not found
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { idProvider, name, category, base_price, selling_price } = req.body;

    if (!idProvider && !name && !category && !base_price && !selling_price) {
      return res
        .status(400)
        .json({ error: "At least one field must be provided" });
    }

    const profit =
      base_price !== undefined && selling_price !== undefined
        ? selling_price - base_price
        : undefined;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        ...(idProvider !== undefined && { idProvider }),
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(base_price !== undefined && { base_price }),
        ...(selling_price !== undefined && { selling_price }),
        ...(profit !== undefined && { profit }),
      },
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Hapus produk
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};
