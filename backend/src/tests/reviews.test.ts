import { z } from "zod";

// Schemas recreated from backend/src/routes/reviews.ts — must stay in sync.
const ratingSchema = z.object({
  productId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const commentSchema = z.object({
  productId: z.number().int().positive(),
  text: z.string().min(1, "Comment cannot be empty").max(2000),
});

const statusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

// ── Rating schema ─────────────────────────────────────────────────────────────

describe("ratingSchema", () => {
  const base = { productId: 1 };

  test("accepts the minimum allowed value (1)", () => {
    expect(ratingSchema.safeParse({ ...base, value: 1 }).success).toBe(true);
  });

  test("accepts the maximum allowed value (5)", () => {
    expect(ratingSchema.safeParse({ ...base, value: 5 }).success).toBe(true);
  });

  test("rejects value 0 (below minimum)", () => {
    expect(ratingSchema.safeParse({ ...base, value: 0 }).success).toBe(false);
  });

  test("rejects value 6 (above maximum)", () => {
    expect(ratingSchema.safeParse({ ...base, value: 6 }).success).toBe(false);
  });
});

// ── Comment schema ────────────────────────────────────────────────────────────

describe("commentSchema", () => {
  const base = { productId: 1 };

  test("accepts valid comment text", () => {
    expect(commentSchema.safeParse({ ...base, text: "Great product!" }).success).toBe(true);
  });

  test("rejects an empty comment", () => {
    expect(commentSchema.safeParse({ ...base, text: "" }).success).toBe(false);
  });

  test("rejects comment text exceeding 2000 characters", () => {
    const text = "x".repeat(2001);
    expect(commentSchema.safeParse({ ...base, text }).success).toBe(false);
  });
});

// ── Comment status schema ─────────────────────────────────────────────────────

describe("statusSchema", () => {
  test('accepts "approved"', () => {
    expect(statusSchema.safeParse({ status: "approved" }).success).toBe(true);
  });

  test('accepts "rejected"', () => {
    expect(statusSchema.safeParse({ status: "rejected" }).success).toBe(true);
  });

  test('rejects any value outside the allowed enum (e.g. "deleted")', () => {
    expect(statusSchema.safeParse({ status: "deleted" }).success).toBe(false);
  });
});
