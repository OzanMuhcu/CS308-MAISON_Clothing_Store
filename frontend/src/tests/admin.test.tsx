import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Admin from "../pages/Admin";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));


const mockApi = api as any;

const baseProduct = {
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
  model: "",
  serialNumber: "",
  warrantyStatus: "",
  distributorInfo: "",
  avgRating: 0,
  ratingCount: 0,
};

const baseOrder = {
  id: 1,
  invoiceNo: "INV-9001",
  totalAmount: 149.99,
  status: "processing",
  createdAt: new Date().toISOString(),
  items: [{ id: 1, productId: 1, productName: "Classic Shirt", unitPrice: 149.99, quantity: 1, lineTotal: 149.99 }],
  address: { fullName: "Bob", line1: "5 Admin Rd", city: "Ankara", postalCode: "06000", country: "Turkey" },
};

const baseRefund = {
  id: 5,
  orderId: 1,
  status: "pending",
  createdAt: new Date().toISOString(),
  resolvedAt: null,
  user: { id: 2, name: "Charlie", email: "charlie@example.com" },
  order: { ...baseOrder },
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
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/products/admin") return Promise.resolve({ data: [baseProduct] });
    if (url === "/orders/admin") return Promise.resolve({ data: [baseOrder] });
    if (url === "/orders/admin/refunds") return Promise.resolve({ data: [baseRefund] });
    return Promise.resolve({ data: [] });
  });
});

// ── Products tab (default) ────────────────────────────────────────────────────

describe("Admin page — products tab", () => {
  test("renders Sales Manager heading", async () => {
    render(<Admin />, { wrapper: Wrapper });
    expect(await screen.findByText(/sales manager/i)).toBeTruthy();
  });

  test("renders product name in default products tab", async () => {
    render(<Admin />, { wrapper: Wrapper });
    expect(await screen.findByText("Classic Shirt")).toBeTruthy();
  });

  test("renders Products, Orders, and Refunds tabs", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");
    expect(screen.getByRole("button", { name: /products/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /orders/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /refunds/i })).toBeTruthy();
  });

  test("renders SKU for the product", async () => {
    render(<Admin />, { wrapper: Wrapper });
    expect(await screen.findByText(/SKU: S001/)).toBeTruthy();
  });

  test("renders Save button for each product", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");
    expect(screen.getByRole("button", { name: /save/i })).toBeTruthy();
  });

  test("shows 'No products available.' when product list is empty", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/admin") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Admin />, { wrapper: Wrapper });
    expect(await screen.findByText("No products available.")).toBeTruthy();
  });
});

// ── Product save validation ───────────────────────────────────────────────────

describe("Admin page — save validation", () => {
  test("shows error when negative price is entered and Save is clicked", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");

    const priceInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(priceInputs[0], { target: { value: "-10" } });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/price must be a non-negative number/i)).toBeTruthy();
    });
  });

  test("shows error when negative discount is entered and Save is clicked", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");

    const priceInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(priceInputs[1], { target: { value: "-5" } });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/discount must be a non-negative number/i)).toBeTruthy();
    });
  });
});

// ── Orders tab ────────────────────────────────────────────────────────────────

describe("Admin page — orders tab", () => {
  test("renders orders tab content after clicking Orders", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");

    fireEvent.click(screen.getByRole("button", { name: /orders/i }));

    expect(await screen.findByText("INV-9001")).toBeTruthy();
  });

  test("shows Start Date and End Date filter fields on orders tab", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");
    fireEvent.click(screen.getByRole("button", { name: /orders/i }));
    await screen.findByText("INV-9001");

    expect(screen.getByText("Start Date")).toBeTruthy();
    expect(screen.getByText("End Date")).toBeTruthy();
  });

  test("shows Revenue section heading on orders tab", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");
    fireEvent.click(screen.getByRole("button", { name: /orders/i }));
    await screen.findByText("INV-9001");

    expect(screen.getByRole("heading", { name: /revenue/i })).toBeTruthy();
  });
});

// ── Refunds tab ───────────────────────────────────────────────────────────────

describe("Admin page — refunds tab", () => {
  test("renders refund user name after clicking Refunds tab", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");

    fireEvent.click(screen.getByRole("button", { name: /refunds/i }));

    // The user name is inline text next to a <span>, so match with regex
    expect(await screen.findByText(/charlie/i)).toBeTruthy();
  });

  test("shows Approve and Reject buttons for pending refund requests", async () => {
    render(<Admin />, { wrapper: Wrapper });
    await screen.findByText("Classic Shirt");
    fireEvent.click(screen.getByRole("button", { name: /refunds/i }));
    await screen.findByText(/charlie/i);

    expect(screen.getByRole("button", { name: /approve/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /reject/i })).toBeTruthy();
  });
});
