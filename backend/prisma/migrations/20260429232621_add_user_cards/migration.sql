-- Saved payment cards for the user. CS308 academic project — full pan
-- and CVV stored in plaintext to support autofill at checkout. Not PCI-safe.
CREATE TABLE "user_cards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "cardholder_name" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "cvv" TEXT NOT NULL DEFAULT '',
    "last_four" TEXT NOT NULL,
    "expiry" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_cards_user_id_idx" ON "user_cards"("user_id");

CREATE UNIQUE INDEX "user_cards_user_id_label_key" ON "user_cards"("user_id", "label");

ALTER TABLE "user_cards"
  ADD CONSTRAINT "user_cards_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
