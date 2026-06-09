import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

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
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../utils/imageUtils", () => ({
  getCategoryFallback: vi.fn().mockReturnValue("https://fallback.img/test.jpg"),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseCart = useCart as ReturnType<typeof vi.fn>;

const baseProduct: Product = {
  id: 1,
  name: "Classic Shirt",
  description: "A classic shirt",
  price: 49.99,
  discount: 0,
  discountName: null,
  discountType: null,
  discountStartsAt: null,
  discountEndsAt: null,
  stockQty: 10,
  sku: "S001",
  imageUrl: "",
  category: "Tops",
  model: "M-001",
  serialNumber: "SN001",
  warrantyStatus: "1 Year",
  distributorInfo: "Dist Co",
  avgRating: 0,
  ratingCount: 0,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {children}
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: null, loading: false });
  mockUseCart.mockReturnValue({ addItem: vi.fn(), items: [], count: 0, total: 0 });
});

// ── Basic rendering ───────────────────────────────────────────────────────────

describe("ProductCard — basic rendering", () => {
  test("displays product name", () => {
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.getByText("Classic Shirt")).toBeTruthy();
  });

  test("displays product category in uppercase label", () => {
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.getByText("Tops")).toBeTruthy();
  });

  test("displays price when no discount is active", () => {
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.getByText("$49.99")).toBeTruthy();
  });
});

// ── Out-of-stock & low-stock ──────────────────────────────────────────────────

describe("ProductCard — stock states", () => {
  test("shows Sold Out overlay when stockQty is 0", () => {
    render(<ProductCard product={{ ...baseProduct, stockQty: 0 }} />, { wrapper: Wrapper });
    expect(screen.getByText("Sold Out")).toBeTruthy();
  });

  test("shows 'Out of stock' text label when stockQty is 0", () => {
    render(<ProductCard product={{ ...baseProduct, stockQty: 0 }} />, { wrapper: Wrapper });
    expect(screen.getByText("Out of stock")).toBeTruthy();
  });

  test("shows low-stock warning when stockQty is between 1 and 4", () => {
    render(<ProductCard product={{ ...baseProduct, stockQty: 3 }} />, { wrapper: Wrapper });
    expect(screen.getByText("Only 3 left")).toBeTruthy();
  });

  test("does not show low-stock warning when stockQty is 5 or more", () => {
    render(<ProductCard product={{ ...baseProduct, stockQty: 5 }} />, { wrapper: Wrapper });
    expect(screen.queryByText(/only \d+ left/i)).toBeNull();
  });

  test("does not render Add to Cart button when out of stock", () => {
    render(<ProductCard product={{ ...baseProduct, stockQty: 0 }} />, { wrapper: Wrapper });
    expect(screen.queryByText("Add to Cart")).toBeNull();
  });

  test("renders Add to Cart button when product is in stock", () => {
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.getByText("Add to Cart")).toBeTruthy();
  });
});

// ── Discount display ──────────────────────────────────────────────────────────

describe("ProductCard — discount", () => {
  test("shows discounted price and strikethrough original when discount is active", () => {
    const discountedProduct: Product = {
      ...baseProduct,
      price: 100,
      discount: 20,
      discountStartsAt: null,
      discountEndsAt: null,
    };
    render(<ProductCard product={discountedProduct} />, { wrapper: Wrapper });
    expect(screen.getByText("$80.00")).toBeTruthy();
    expect(screen.getByText("$100.00")).toBeTruthy();
  });

  test("shows discount badge with percentage when discount is active", () => {
    const discountedProduct: Product = {
      ...baseProduct,
      price: 100,
      discount: 25,
    };
    render(<ProductCard product={discountedProduct} />, { wrapper: Wrapper });
    expect(screen.getByText("25% Off")).toBeTruthy();
  });

  test("does not show discount badge when discount is 0", () => {
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.queryByText(/% Off/)).toBeNull();
  });

  test("does not apply discount when startDate is in the future", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const product: Product = { ...baseProduct, price: 100, discount: 30, discountStartsAt: future };
    render(<ProductCard product={product} />, { wrapper: Wrapper });
    expect(screen.getByText("$100.00")).toBeTruthy();
    expect(screen.queryByText("$70.00")).toBeNull();
  });

  test("does not apply discount when endDate is in the past", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const product: Product = { ...baseProduct, price: 100, discount: 30, discountEndsAt: past };
    render(<ProductCard product={product} />, { wrapper: Wrapper });
    expect(screen.queryByText("$70.00")).toBeNull();
  });

  test("shows discount campaign name when discount is active and discountName is set", () => {
    const product: Product = {
      ...baseProduct,
      price: 100,
      discount: 10,
      discountName: "Spring Edit",
    };
    render(<ProductCard product={product} />, { wrapper: Wrapper });
    expect(screen.getByText("Spring Edit")).toBeTruthy();
  });
});

// ── Rating display ────────────────────────────────────────────────────────────

describe("ProductCard — ratings", () => {
  test("shows rating when ratingCount > 0", () => {
    const rated: Product = { ...baseProduct, avgRating: 4.2, ratingCount: 7 };
    render(<ProductCard product={rated} />, { wrapper: Wrapper });
    expect(screen.getByText(/4\.2/)).toBeTruthy();
    expect(screen.getByText(/\(7\)/)).toBeTruthy();
  });

  test("does not show rating section when ratingCount is 0", () => {
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.queryByText(/\(\d+\)/)).toBeNull();
  });
});

// ── Wishlist button ───────────────────────────────────────────────────────────

describe("ProductCard — wishlist", () => {
  test("does not show wishlist button when user is not logged in", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.queryByTitle("Choose wishlist")).toBeNull();
  });

  test("shows wishlist button when user is logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: "Alice", email: "a@b.com", role: "customer", createdAt: "" },
      loading: false,
    });
    render(<ProductCard product={baseProduct} />, { wrapper: Wrapper });
    expect(screen.getByTitle("Choose wishlist")).toBeTruthy();
  });
});
