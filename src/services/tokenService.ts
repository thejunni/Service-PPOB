// src/services/tokenService.ts
import jwt, { SignOptions } from "jsonwebtoken";
import prisma from "../prisma";
import { addDays } from "date-fns";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

/**
 * Membuat Access Token (JWT)
 */
export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
};

/**
 * Verifikasi Access Token
 */
export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Verifikasi Refresh Token
 */
export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Membuat Refresh Token dan simpan ke DB
 */
export const createRefreshToken = async (userId: number) => {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: `${REFRESH_DAYS}d`,
  });

  const expiresAt = addDays(new Date(), REFRESH_DAYS);

  const dbToken = await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return dbToken.token;
};

/**
 * Menandai refresh token sebagai revoked
 */
export const revokeRefreshToken = async (token: string) => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

/**
 * Mencari refresh token di DB
 */
export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({ where: { token } });
};
