/*
  Warnings:

  - A unique constraint covering the columns `[serial_number]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serial_number` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "distributor_info" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "model" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "serial_number" TEXT NOT NULL,
ADD COLUMN     "warranty_status" TEXT NOT NULL DEFAULT 'None';

-- CreateIndex
CREATE UNIQUE INDEX "products_serial_number_key" ON "products"("serial_number");
