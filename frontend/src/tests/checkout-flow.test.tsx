import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Checkout from "../pages/Checkout";
import Payment from "../pages/Payment";
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

// api.get resolves per URL; returns safe defaults for everything else.
vi.mock("../services/api", () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === "/users/me/addresses") return Promise.resolve({ data: { addresses: [] } });
      if (url === "/users/me/cards") return Promise.resolve({ data: { cards: [] } });
      return Promise.resolve({ data: {} });
    }),
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

const mockDisplayItem = {
  itemId: 10,
  productId: 1,
  quantity: 1,
  name: "Classic Shirt",
  price: 49.99,
  imageUrl: "",
  stockQty: 10,
  sku: "S001",
};

const mockAddress = JSON.stringify({
  fullName: "Alice Smith",
  line1: "123 Main St",
  city: "New York",
  postalCode: "10001",
  country: "US",
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  // Default: logged-in user with one item in cart (count > 0 prevents Checkout
  // empty-state early return and avoids the hooks ordering issue in Checkout.tsx).
  mockUseAuth.mockReturnValue({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
  mockUseCart.mockReturnValue({
    items: [mockDisplayItem],
    count: 1,
    total: 49.99,
    addItem: vi.fn(),
    updateQty: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    loading: false,
  });
});

// ── Checkout page ─────────────────────────────────────────────────────────────

describe("Checkout page", () => {
  test("renders Delivery Address heading", () => {
    render(<Checkout />, { wrapper: Wrapper });
    expect(screen.getByRole("heading", { name: /delivery address/i })).toBeTruthy();
  });

  test("renders Order Summary section", () => {
    render(<Checkout />, { wrapper: Wrapper });
    expect(screen.getByText(/order summary/i)).toBeTruthy();
  });

  test("renders Continue to Payment button", () => {
    render(<Checkout />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /continue to payment/i })).toBeTruthy();
  });

  test("shows cart item name in the order summary panel", () => {
    render(<Checkout />, { wrapper: Wrapper });
    expect(screen.getByText("Classic Shirt")).toBeTruthy();
  });
});

// ── Payment page ──────────────────────────────────────────────────────────────

describe("Payment page", () => {
  test("renders Payment Details heading when address is stored", () => {
    // Payment page reads checkoutAddress from sessionStorage; without it the
    // page redirects to /checkout before rendering the form.
    sessionStorage.setItem("checkoutAddress", mockAddress);
    render(<Payment />, { wrapper: Wrapper });
    expect(screen.getByRole("heading", { name: /payment details/i })).toBeTruthy();
  });
});
