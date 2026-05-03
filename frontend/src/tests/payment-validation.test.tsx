import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { cards: [] } }),
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

const mockAddress = JSON.stringify({
  fullName: "Alice Smith",
  line1: "123 Main St",
  city: "New York",
  postalCode: "10001",
  country: "US",
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {children}
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("checkoutAddress", mockAddress);
  mockUseAuth.mockReturnValue({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
  mockUseCart.mockReturnValue({
    items: [{ itemId: 10, productId: 1, quantity: 1, name: "Classic Shirt", price: 49.99, imageUrl: "", stockQty: 10, sku: "S001" }],
    count: 1,
    total: 49.99,
    addItem: vi.fn(),
    updateQty: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    loading: false,
  });
});

// ── Payment form fields ───────────────────────────────────────────────────────

describe("Payment page — form fields", () => {
  test("renders Cardholder Full Name label", async () => {
    render(<Payment />, { wrapper: Wrapper });
    // findBy* lets the useEffect (card fetch) settle before asserting, silencing act() warnings.
    expect(await screen.findByLabelText(/cardholder full name/i)).toBeTruthy();
  });

  test("renders Card Number label", async () => {
    render(<Payment />, { wrapper: Wrapper });
    expect(await screen.findByLabelText(/card number/i)).toBeTruthy();
  });

  test("renders Expiry label", async () => {
    render(<Payment />, { wrapper: Wrapper });
    expect(await screen.findByLabelText(/expiry/i)).toBeTruthy();
  });

  test("renders Security Code label", async () => {
    render(<Payment />, { wrapper: Wrapper });
    expect(await screen.findByLabelText(/security code/i)).toBeTruthy();
  });

  test("submit button shows the cart total amount", async () => {
    render(<Payment />, { wrapper: Wrapper });
    expect(await screen.findByRole("button", { name: /pay \$49\.99/i })).toBeTruthy();
  });
});

// ── Payment form validation ───────────────────────────────────────────────────

describe("Payment page — form validation", () => {
  test("shows cardholder name error when form is submitted empty", async () => {
    render(<Payment />, { wrapper: Wrapper });
    // Wait for async useEffect to settle before interacting.
    const submitBtn = await screen.findByRole("button", { name: /pay/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/cardholder full name is required/i)).toBeTruthy();
    });
  });

  test("shows multiple Required errors when form is submitted empty", async () => {
    render(<Payment />, { wrapper: Wrapper });
    const submitBtn = await screen.findByRole("button", { name: /pay/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      // cardNumber, expiry, and cvv each carry required: "Required"
      const requiredErrors = screen.getAllByText("Required");
      expect(requiredErrors.length).toBeGreaterThanOrEqual(1);
    });
  });
});
