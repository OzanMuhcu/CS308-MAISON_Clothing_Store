import { registerSchema, loginSchema } from "../validators/auth";

// ---- Zod validation tests ----

describe("registerSchema", () => {
  test("accepts valid input", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "a@b.com",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  test("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "a@b.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing fields", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  test("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "alice@example.com",
      password: "something",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "bad",
      password: "something",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

// ---- Password hashing tests ----

describe("bcrypt hashing", () => {
  const bcrypt = require("bcryptjs");

  test("hash is not plaintext", async () => {
    const hash = await bcrypt.hash("mypassword", 12);
    expect(hash).not.toBe("mypassword");
    expect(hash.length).toBeGreaterThan(50);
  });

  test("correct password verifies", async () => {
    const hash = await bcrypt.hash("correct", 12);
    expect(await bcrypt.compare("correct", hash)).toBe(true);
  });

  test("wrong password fails", async () => {
    const hash = await bcrypt.hash("correct", 12);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });
});

// ---- JWT tests ----

describe("JWT tokens", () => {
  const jwt = require("jsonwebtoken");
  const secret = "test-secret";

  test("sign and verify round-trips", () => {
    const payload = { userId: 42, role: "customer" };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe(42);
    expect(decoded.role).toBe("customer");
  });

  test("wrong secret rejects", () => {
    const token = jwt.sign({ userId: 1 }, secret);
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });

  test("expired token rejects", () => {
    const token = jwt.sign({ userId: 1 }, secret, { expiresIn: "0s" });
    expect(() => jwt.verify(token, secret)).toThrow();
  });
});
