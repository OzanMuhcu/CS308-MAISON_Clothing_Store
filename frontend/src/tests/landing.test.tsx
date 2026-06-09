import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: vi.fn().mockReturnValue({ user: null, loading: false }),
}));

vi.mock("../context/CartContext", () => ({
  CartProvider: ({ children }: any) => children,
  useCart: vi.fn().mockReturnValue({ addItem: vi.fn(), items: [], count: 0, total: 0 }),
}));

vi.mock("../utils/imageUtils", () => ({
  getCategoryFallback: vi.fn().mockReturnValue("https://fallback.img/test.jpg"),
}));

const mockApi = api as any;

const makeProduct = (id: number, name: string, category: string, price = 49.99) => ({
  id,
  name,
  description: "",
  price,
  discount: 0,
  discountName: null,
  discountType: null,
  discountStartsAt: null,
  discountEndsAt: null,
  stockQty: 10,
  sku: `SKU-${id}`,
  imageUrl: "",
  category,
  model: "",
  serialNumber: "",
  warrantyStatus: "",
  distributorInfo: "",
  avgRating: 0,
  ratingCount: 0,
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
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/products/categories") return Promise.resolve({ data: ["Tops", "Shoes", "Bags"] });
    if (url === "/products") return Promise.resolve({ data: [makeProduct(1, "Classic Shirt", "Tops"), makeProduct(2, "Leather Bag", "Bags")] });
    return Promise.resolve({ data: [] });
  });
});

// ── Hero section ──────────────────────────────────────────────────────────────

describe("Landing — hero section", () => {
  test("renders hero headline", async () => {
    render(<Landing />, { wrapper: Wrapper });
    expect(screen.getByText(/considered clothing/i)).toBeTruthy();
  });

  test("renders Shop Now link", async () => {
    render(<Landing />, { wrapper: Wrapper });
    expect(screen.getByText("Shop Now")).toBeTruthy();
  });

  test("renders Collection heading", async () => {
    render(<Landing />, { wrapper: Wrapper });
    expect(screen.getByText("Collection")).toBeTruthy();
  });
});

// ── Product grid ──────────────────────────────────────────────────────────────

describe("Landing — product grid", () => {
  test("renders product names returned by the API", async () => {
    render(<Landing />, { wrapper: Wrapper });
    expect(await screen.findByText("Classic Shirt")).toBeTruthy();
    expect(await screen.findByText("Leather Bag")).toBeTruthy();
  });

  test("shows correct piece count for multiple products", async () => {
    render(<Landing />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");
    expect(screen.getByText(/2 pieces/i)).toBeTruthy();
  });

  test("shows '1 piece' (singular) for a single product", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/categories") return Promise.resolve({ data: [] });
      if (url === "/products") return Promise.resolve({ data: [makeProduct(1, "Solo Tee", "Tops")] });
      return Promise.resolve({ data: [] });
    });
    render(<Landing />, { wrapper: Wrapper });
    await screen.findByText("Solo Tee");
    expect(screen.getByText(/1 piece/i)).toBeTruthy();
  });

  test("renders Search input field", async () => {
    render(<Landing />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText("Search...")).toBeTruthy();
  });

  test("renders category dropdown with All Categories default", async () => {
    render(<Landing />, { wrapper: Wrapper });
    expect(await screen.findByText("All Categories")).toBeTruthy();
  });

  test("populates category options from API", async () => {
    render(<Landing />, { wrapper: Wrapper });
    // Use role-specific query to target the <option> elements in the dropdown
    expect(await screen.findByRole("option", { name: "Tops" })).toBeTruthy();
    expect(await screen.findByRole("option", { name: "Shoes" })).toBeTruthy();
    expect(await screen.findByRole("option", { name: "Bags" })).toBeTruthy();
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("Landing — empty state", () => {
  test("shows 0 pieces when API returns empty array", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/categories") return Promise.resolve({ data: [] });
      if (url === "/products") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Landing />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/0 pieces/i)).toBeTruthy();
    });
  });
});

// ── Search filter ─────────────────────────────────────────────────────────────

describe("Landing — search filter", () => {
  test("calls API with search param when user types in search box", async () => {
    render(<Landing />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");

    mockApi.get.mockImplementation((url: string, opts: any) => {
      if (url === "/products") {
        if (opts?.params?.search === "shirt") {
          return Promise.resolve({ data: [makeProduct(1, "Classic Shirt", "Tops")] });
        }
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "shirt" } });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        "/products",
        expect.objectContaining({ params: expect.objectContaining({ search: "shirt" }) })
      );
    });
  });

  test("calls API without search param when search box is cleared", async () => {
    render(<Landing />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");

    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "" } });

    await waitFor(() => {
      const calls = mockApi.get.mock.calls.filter(([url]: [string]) => url === "/products");
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1]?.params?.search).toBeUndefined();
    });
  });
});

// ── Category filter ───────────────────────────────────────────────────────────

describe("Landing — category filter", () => {
  test("calls API with category param when category is selected", async () => {
    render(<Landing />, { wrapper: Wrapper });
    await screen.findByText("Tops");

    mockApi.get.mockImplementation((url: string, opts: any) => {
      if (url === "/products") {
        return Promise.resolve({ data: [makeProduct(1, "Filtered Shirt", "Tops")] });
      }
      return Promise.resolve({ data: [] });
    });

    const selects = screen.getAllByRole("combobox");
    // First combobox is the category filter, second is the sort filter
    fireEvent.change(selects[0], { target: { value: "Tops" } });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        "/products",
        expect.objectContaining({ params: expect.objectContaining({ category: "Tops" }) })
      );
    });
  });
});
