import { isDiscountActive, getEffectivePrice } from "../services/discountUtils";

// ── isDiscountActive ──────────────────────────────────────────────────────────

describe("isDiscountActive", () => {
  test("returns false when discount is 0", () => {
    expect(isDiscountActive(0)).toBe(false);
  });

  test("returns false when discount is negative", () => {
    expect(isDiscountActive(-5)).toBe(false);
  });

  test("returns true when discount > 0 and no date constraints", () => {
    expect(isDiscountActive(20)).toBe(true);
  });

  test("returns true when discount > 0 with null start and end", () => {
    expect(isDiscountActive(10, null, null)).toBe(true);
  });

  test("returns false when startsAt is in the future", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isDiscountActive(20, future)).toBe(false);
  });

  test("returns false when endsAt is in the past", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(isDiscountActive(20, null, past)).toBe(false);
  });

  test("returns true when within a valid date window (past start, future end)", () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);
    expect(isDiscountActive(20, past, future)).toBe(true);
  });

  test("returns true when only startsAt is set and it is past", () => {
    const past = new Date(Date.now() - 1000);
    expect(isDiscountActive(10, past, null)).toBe(true);
  });
});

// ── getEffectivePrice ─────────────────────────────────────────────────────────

describe("getEffectivePrice", () => {
  test("returns full price when discount is 0", () => {
    expect(getEffectivePrice({ price: 100, discount: 0 })).toBe(100);
  });

  test("returns full price when discount is null", () => {
    expect(getEffectivePrice({ price: 100, discount: null })).toBe(100);
  });

  test("returns full price when discount is undefined", () => {
    expect(getEffectivePrice({ price: 100 })).toBe(100);
  });

  test("applies an active 25% discount correctly", () => {
    expect(getEffectivePrice({ price: 200, discount: 25 })).toBe(150);
  });

  test("applies a 10% discount and rounds to 2 decimal places", () => {
    // $0.99 * 90% = $0.891 → Math.round(89.1)/100 = $0.89
    expect(getEffectivePrice({ price: 0.99, discount: 10 })).toBe(0.89);
  });

  test("returns full price when discount startDate is in the future", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(
      getEffectivePrice({ price: 100, discount: 20, discountStartsAt: future })
    ).toBe(100);
  });

  test("returns full price when discount endDate is in the past", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(
      getEffectivePrice({ price: 100, discount: 20, discountEndsAt: past })
    ).toBe(100);
  });

  test("clamps effective price to 0 for a 100% discount", () => {
    expect(getEffectivePrice({ price: 50, discount: 100 })).toBe(0);
  });
});
