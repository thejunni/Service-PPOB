import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer <token>

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // Verify token
    const payload = jwt.verify(token, JWT_SECRET) as any;

    // Simpan data user ke request
    (req as any).userId = payload.userId;
    (req as any).role = payload.role;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const role = (req as any).role;
  if (role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
};
