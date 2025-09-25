/*
  Warnings:

  - Added the required column `base_price` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profit` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selling_price` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "base_price" INTEGER NOT NULL,
ADD COLUMN     "profit" INTEGER NOT NULL,
ADD COLUMN     "selling_price" INTEGER NOT NULL;
