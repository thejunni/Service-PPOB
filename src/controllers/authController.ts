import { Request, Response } from "express";
import prisma from "../prisma";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  signAccessToken,
  createRefreshToken,
  verifyAccessToken,
  findRefreshToken,
  revokeRefreshToken,
} from "../services/tokenService";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autentikasi pengguna
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
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User berhasil dibuat
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

  // set HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    // secure: true in production
  });

  res
    .status(201)
    .json({
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
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
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
 *     summary: Refresh token akses
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token diperbarui
 */
export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  const dbToken = await findRefreshToken(token);
  if (!dbToken || dbToken.revoked)
    return res.status(401).json({ message: "Invalid refresh token" });

  try {
    const payload = verifyAccessToken(token) as any; // token includes userId
    const userId = payload?.userId;
    if (!userId)
      return res.status(401).json({ message: "Invalid token payload" });

    // issue new tokens
    const accessToken = signAccessToken({ userId, role: payload.role });
    const newRefresh = await createRefreshToken(userId);

    // revoke old token
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
 *     summary: Logout user
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

export const me = async (req: Request, res: Response) => {
  // middleware harus set req.userId
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Unauthenticated" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true, status: true },
  });
  res.json({ user });
};
