import jwt from "jsonwebtoken";
import { authenticate, authorize } from "../middleware/auth";
import type { Request, Response, NextFunction } from "express";

// The env module defaults jwtSecret to "dev-secret-change-in-production"
// when JWT_SECRET is not set — use that value in all token fixtures.
const TEST_SECRET = "dev-secret-change-in-production";

function makeReq(overrides: Record<string, any> = {}): Request {
  return { headers: {}, ...overrides } as unknown as Request;
}

function makeRes() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;
  return { res, status, json };
}

// ── authenticate ──────────────────────────────────────────────────────────────

describe("authenticate", () => {
  test("returns 401 when the Authorization header is missing", () => {
    const req = makeReq();
    const { res, status } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });

  test("returns 401 when the header does not start with 'Bearer '", () => {
    const req = makeReq({ headers: { authorization: "Token some-token" } });
    const { res, status } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });

  test("returns 401 when the token is syntactically invalid", () => {
    const req = makeReq({ headers: { authorization: "Bearer totally.invalid.token" } });
    const { res, status } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });

  test("calls next() and attaches decoded user when token is valid", () => {
    const payload = { userId: 7, email: "alice@test.com", role: "customer" };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const { res } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as any).user.userId).toBe(7);
    expect((req as any).user.role).toBe("customer");
  });

  test("returns 401 for an expired token", () => {
    const token = jwt.sign({ userId: 1, role: "customer" }, TEST_SECRET, { expiresIn: "0s" });
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const { res, status } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });
});

// ── authorize ─────────────────────────────────────────────────────────────────

describe("authorize", () => {
  test("returns 401 when req.user is not set (called without authenticate)", () => {
    const req = makeReq();
    const { res, status } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authorize("sales_manager")(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 when user role does not match the required role", () => {
    const req = makeReq() as any;
    req.user = { userId: 1, role: "customer" };
    const { res, status } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authorize("sales_manager")(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("calls next() when user has the exact required role", () => {
    const req = makeReq() as any;
    req.user = { userId: 2, role: "sales_manager" };
    const { res } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authorize("sales_manager")(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("calls next() when user matches one of multiple allowed roles", () => {
    const req = makeReq() as any;
    req.user = { userId: 3, role: "product_manager" };
    const { res } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authorize("sales_manager", "product_manager")(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("returns 403 when customer tries to access a manager-only route", () => {
    const req = makeReq() as any;
    req.user = { userId: 4, role: "customer" };
    const { res, status } = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    authorize("sales_manager", "product_manager")(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
