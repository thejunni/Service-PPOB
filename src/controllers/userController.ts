import { Request, Response } from "express";
import prisma from "../prisma";

export const getUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const user = await prisma.user.create({
    data: { username, email, password },
  });
  res.json(user);
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { status },
  });
  res.json(user);
};
