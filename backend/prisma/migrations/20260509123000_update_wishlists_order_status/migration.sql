-- Add wishlists and migrate existing wishlist items
CREATE TABLE "wishlists" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "wishlists_user_id_name_key" ON "wishlists" ("user_id", "name");

CREATE INDEX "wishlists_user_id_idx" ON "wishlists" ("user_id");

ALTER TABLE "wishlist_items" ADD COLUMN "wishlist_id" INTEGER;

INSERT INTO
    "wishlists" ("user_id", "name")
SELECT DISTINCT
    "user_id",
    'My Wishlist'
FROM "wishlist_items" ON CONFLICT DO NOTHING;

UPDATE "wishlist_items" wi
SET "wishlist_id" = w."id"
FROM "wishlists" w
WHERE w."user_id" = wi."user_id" AND w."name" = 'My Wishlist' AND wi."wishlist_id" IS NULL;

ALTER TABLE "wishlist_items" ALTER COLUMN "wishlist_id" SET NOT NULL;

ALTER TABLE "wishlist_items"
DROP CONSTRAINT IF EXISTS "wishlist_items_user_id_fkey";

DROP INDEX IF EXISTS "wishlist_items_user_id_product_id_key";

DROP INDEX IF EXISTS "wishlist_items_user_id_idx";

ALTER TABLE "wishlist_items" DROP COLUMN IF EXISTS "user_id";

CREATE INDEX "wishlist_items_wishlist_id_idx" ON "wishlist_items" ("wishlist_id");

CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items" ("wishlist_id", "product_id");

ALTER TABLE "wishlist_items"
ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wishlists"
ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update order status enum to the new values
CREATE TYPE "OrderStatus_new" AS ENUM ('processing', 'in_transit', 'delivered');

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'processing' THEN 'processing'::"OrderStatus_new"
      WHEN "status"::text = 'shipped' THEN 'in_transit'::"OrderStatus_new"
      WHEN "status"::text = 'confirmed' THEN 'processing'::"OrderStatus_new"
      WHEN "status"::text = 'delivered' THEN 'delivered'::"OrderStatus_new"
      WHEN "status"::text = 'cancelled' THEN 'processing'::"OrderStatus_new"
      ELSE 'processing'::"OrderStatus_new"
    END
  );

DROP TYPE "OrderStatus";

ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'processing';