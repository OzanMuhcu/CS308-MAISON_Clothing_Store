import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Cart from "../pages/Cart";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: vi.fn(),
}));

vi.mock("../context/CartContext", () => ({
  CartProvider: ({ children }: any) => children,
  useCart: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// ── Typed mock helpers ────────────────────────────────────────────────────────

const mockUseAuth = useAuth as any;
const mockUseCart = useCart as any;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  name: "Alice Smith",
  email: "alice@example.com",
  role: "customer" as const,
  createdAt: "2025-01-01T00:00:00Z",
};

const mockDisplayItems = [
  {
    itemId: 10,
    productId: 1,
    quantity: 2,
    name: "Classic Shirt",
    price: 49.99,
    imageUrl: "",
    stockQty: 10,
    sku: "S001",
  },
  {
    itemId: 11,
    productId: 2,
    quantity: 1,
    name: "Slim Trousers",
    price: 79.99,
    imageUrl: "",
    stockQty: 5,
    sku: "T002",
  },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

// ── Default mock values reset before every test ───────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
  mockUseCart.mockReturnValue({
    items: mockDisplayItems,
    count: 2,
    total: 179.97,
    addItem: vi.fn(),
    updateQty: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    loading: false,
  });
});

// ── Cart — items visible ──────────────────────────────────────────────────────

describe("Cart page — items display", () => {
  test("renders Your Cart heading", () => {
    render(<Cart />, { wrapper: Wrapper });
    expect(screen.getByRole("heading", { name: /your cart/i })).toBeTruthy();
  });

  test("shows product names for each cart item", () => {
    render(<Cart />, { wrapper: Wrapper });
    expect(screen.getByText("Classic Shirt")).toBeTruthy();
    expect(screen.getByText("Slim Trousers")).toBeTruthy();
  });

  test("shows total price in the cart footer", () => {
    render(<Cart />, { wrapper: Wrapper });
    expect(screen.getByText("$179.97")).toBeTruthy();
  });
});

// ── Cart — logged-in user ─────────────────────────────────────────────────────

describe("Cart page — logged-in user", () => {
  test("shows Proceed to Checkout button when user is logged in", () => {
    render(<Cart />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /proceed to checkout/i })).toBeTruthy();
  });
});

// ── Cart — guest user ─────────────────────────────────────────────────────────

describe("Cart page — guest user", () => {
  test("shows empty-cart message when there are no items", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() });
    mockUseCart.mockReturnValue({ items: [], count: 0, total: 0, addItem: vi.fn(), updateQty: vi.fn(), removeItem: vi.fn(), clearCart: vi.fn(), loading: false });
    render(<Cart />, { wrapper: Wrapper });
    expect(screen.getByText(/your cart is empty/i)).toBeTruthy();
  });

  test("shows Sign In to Checkout button (disabled) when guest has items in cart", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() });
    render(<Cart />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /sign in to checkout/i })).toBeTruthy();
  });
});
