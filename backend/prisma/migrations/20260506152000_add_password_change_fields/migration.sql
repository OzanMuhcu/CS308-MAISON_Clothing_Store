-- AlterTable
ALTER TABLE "users"
ADD COLUMN "password_change_code" TEXT,
ADD COLUMN "password_change_code_expires_at" TIMESTAMP,
ADD COLUMN "password_change_new_hash" TEXT;
