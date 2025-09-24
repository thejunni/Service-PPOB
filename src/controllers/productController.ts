import { Request, Response } from "express";
import prisma from "../prisma";

export const getProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany();
  res.json(products);
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, category, price } = req.body;
  const product = await prisma.product.create({
    data: { name, category, price },
  });
  res.json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, price } = req.body;
  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: { name, category, price },
  });
  res.json(product);
};
