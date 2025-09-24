import { Request, Response } from "express";
import prisma from "../prisma";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoint untuk user
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Ambil semua user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List semua user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
export const getUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Buat user baru
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
export const createUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const user = await prisma.user.create({
    data: { username, email, password },
  });
  res.json(user);
};

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Update status user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, UNVERIFIED, PENDING]
 *     responses:
 *       200:
 *         description: Status user berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { status },
  });
  res.json(user);
};
