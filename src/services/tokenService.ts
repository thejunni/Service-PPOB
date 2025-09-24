// import jwt from "jsonwebtoken";
import jwt, { SignOptions } from "jsonwebtoken";
import prisma from "../prisma";
import { addDays } from "date-fns";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

export const signAccessToken = (payload: object): string => {
  return jwt.sign(
    payload,
    JWT_SECRET as string,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions
  );
};


export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET as string);
  } catch (err) {
    return null;
  }
};


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

export const revokeRefreshToken = async (token: string) => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({ where: { token } });
};
