// src/controllers/authController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  signAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from "../services/tokenService";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoint untuk autentikasi dan otorisasi
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrasi user baru
 *     tags: [Auth]
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
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *       400:
 *         description: Data tidak lengkap
 *       409:
 *         description: User sudah ada
 */
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "username, email, password required" });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) return res.status(409).json({ message: "User already exists" });

  const hashed = await hashPassword(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await createRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
  });

  res.status(201).json({
    user: { id: user.id, username: user.username, email: user.email },
    accessToken,
  });
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user dan mendapatkan JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Kredensial salah
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "email & password required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await comparePassword(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await createRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
  });

  res.json({
    accessToken,
    user: { id: user.id, username: user.username, email: user.email },
  });
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token menggunakan refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your_refresh_token_here
 *     responses:
 *       200:
 *         description: Token berhasil diperbarui
 *       401:
 *         description: Refresh token tidak valid
 */
export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  const dbToken = await findRefreshToken(token);
  if (!dbToken || dbToken.revoked)
    return res.status(401).json({ message: "Invalid refresh token" });

  try {
    const payload = verifyRefreshToken(token) as any;
    const userId = payload?.userId;
    if (!userId)
      return res.status(401).json({ message: "Invalid token payload" });

    const accessToken = signAccessToken({ userId, role: payload.role });
    const newRefresh = await createRefreshToken(userId);

    await revokeRefreshToken(token);

    res.cookie("refreshToken", newRefresh, { httpOnly: true, sameSite: "lax" });
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user (revoke refresh token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout berhasil
 */
export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) {
    await revokeRefreshToken(token);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Mendapatkan profil user yang sedang login
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil user
 *       401:
 *         description: Tidak terautentikasi
 */
export const me = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Unauthenticated" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true, status: true },
  });
  res.json({ user });
};
