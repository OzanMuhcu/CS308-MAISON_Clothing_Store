-- AlterTable
ALTER TABLE "products" ADD COLUMN     "discount_ends_at" TIMESTAMP(3),
ADD COLUMN     "discount_name" TEXT,
ADD COLUMN     "discount_starts_at" TIMESTAMP(3),
ADD COLUMN     "discount_type" TEXT;
