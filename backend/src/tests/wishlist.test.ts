import { z } from "zod";

// Recreated from backend/src/routes/wishlist.ts — must stay in sync with the route.
const wishlistNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Wishlist name is required")
    .max(40, "Wishlist name must be under 40 characters"),
});

// Route checks: !productId || typeof productId !== "number"
function isValidProductId(value: unknown): boolean {
  return Boolean(value) && typeof value === "number";
}

// ── Wishlist name schema ──────────────────────────────────────────────────────

describe("wishlistNameSchema", () => {
  test("accepts a name with 1 character", () => {
    expect(wishlistNameSchema.safeParse({ name: "A" }).success).toBe(true);
  });

  test("accepts a name at exactly 40 characters", () => {
    const name = "A".repeat(40);
    expect(wishlistNameSchema.safeParse({ name }).success).toBe(true);
  });

  test("rejects an empty string", () => {
    expect(wishlistNameSchema.safeParse({ name: "" }).success).toBe(false);
  });

  test("rejects a name exceeding 40 characters", () => {
    const name = "A".repeat(41);
    expect(wishlistNameSchema.safeParse({ name }).success).toBe(false);
  });

  test("rejects a whitespace-only name after trimming", () => {
    expect(wishlistNameSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});

// ── Product ID validation (mirrors route guard) ───────────────────────────────

describe("wishlist item productId validation", () => {
  test("rejects zero (falsy value)", () => {
    expect(isValidProductId(0)).toBe(false);
  });

  test("rejects a string that looks like a number", () => {
    expect(isValidProductId("1")).toBe(false);
  });
});
