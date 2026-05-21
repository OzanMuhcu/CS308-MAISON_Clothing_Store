-- Story 41: Product Manager-controlled category list.
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE INDEX "categories_hidden_idx" ON "categories"("hidden");

-- Seed the table with every distinct, non-empty category currently in use by
-- existing products, so the PM admin shows the full list on first load.
INSERT INTO "categories" ("name", "updated_at")
SELECT DISTINCT "category", CURRENT_TIMESTAMP
FROM "products"
WHERE "category" <> ''
ON CONFLICT ("name") DO NOTHING;
