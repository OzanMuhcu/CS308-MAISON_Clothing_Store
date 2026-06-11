import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProductManagerAdmin from "../pages/ProductManagerAdmin";
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
  name: "Canvas Jacket",
  sku: "J001",
  price: 120,
  stockQty: 8,
  category: "Outerwear",
  serialNumber: "SN-J001",
  description: "A solid jacket",
  imageUrl: "",
  model: "Regular",
  warrantyStatus: "1 Year",
  distributorInfo: "Dist Ltd",
  isActive: true,
};

const baseCategory = {
  id: 1,
  name: "Outerwear",
  hidden: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const pendingComment = {
  id: 10,
  text: "Great product!",
  status: "pending",
  createdAt: new Date().toISOString(),
  user: { id: 2, name: "Dave", email: "dave@example.com" },
  product: { id: 1, name: "Canvas Jacket" },
};

const pmOrder = {
  id: 1,
  invoiceNo: "INV-PM01",
  totalAmount: 240.00,
  status: "processing",
  createdAt: new Date().toISOString(),
  user: { id: 2, name: "Eve", email: "eve@example.com" },
  items: [{ id: 1, productId: 42, productName: "Canvas Jacket", quantity: 2 }],
  address: null,
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
  // Default: products tab loads on mount
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/products/manager") return Promise.resolve({ data: [baseProduct] });
    if (url === "/categories/all") return Promise.resolve({ data: [baseCategory] });
    if (url === "/reviews/pending") return Promise.resolve({ data: [pendingComment] });
    if (url === "/orders/manager") return Promise.resolve({ data: [pmOrder] });
    return Promise.resolve({ data: [] });
  });
});

// ── Tabs rendered ─────────────────────────────────────────────────────────────

describe("ProductManagerAdmin — tab navigation", () => {
  test("renders all four tabs: Products, Categories, Orders, Comments", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    expect(await screen.findByRole("button", { name: "Products" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Categories" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Orders" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Comments" })).toBeTruthy();
  });

  test("defaults to Products tab showing All Products heading", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    expect(await screen.findByText("All Products")).toBeTruthy();
  });
});

// ── Products tab ──────────────────────────────────────────────────────────────

describe("ProductManagerAdmin — products tab", () => {
  test("shows product name in products table", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    expect(await screen.findByText("Canvas Jacket")).toBeTruthy();
  });

  test("shows product SKU in products table", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    expect(await screen.findByText("J001")).toBeTruthy();
  });

  test("shows + Add Product button", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    expect(screen.getByRole("button", { name: /add product/i })).toBeTruthy();
  });

  test("reveals New Product form when + Add Product is clicked", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    expect(await screen.findByText("New Product")).toBeTruthy();
  });

  test("shows 'No products found.' when product list is empty", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/manager") return Promise.resolve({ data: [] });
      if (url === "/categories/all") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    expect(await screen.findByText("No products found.")).toBeTruthy();
  });

  test("shows Remove and Edit action buttons for each product", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    expect(await screen.findByRole("button", { name: "Remove" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
  });
});

// ── Categories tab ────────────────────────────────────────────────────────────

describe("ProductManagerAdmin — categories tab", () => {
  test("shows All Categories heading after clicking Categories tab", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Categories" }));
    expect(await screen.findByText("All Categories")).toBeTruthy();
  });

  test("renders category name card on categories tab", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Categories" }));
    expect(await screen.findByText("Outerwear")).toBeTruthy();
  });

  test("shows Visible badge for a non-hidden category", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Categories" }));
    expect(await screen.findByText("Visible")).toBeTruthy();
  });

  test("shows Hidden badge for a hidden category", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/manager") return Promise.resolve({ data: [] });
      if (url === "/categories/all") return Promise.resolve({ data: [{ ...baseCategory, hidden: true }] });
      return Promise.resolve({ data: [] });
    });
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Categories" }));
    expect(await screen.findByText("Hidden")).toBeTruthy();
  });

  test("shows Add Category form and button", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Categories" }));
    expect(await screen.findByText("Create Category")).toBeTruthy();
    expect(screen.getByPlaceholderText(/outerwear/i)).toBeTruthy();
  });

  test("shows 'No categories yet' when category list is empty", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/manager") return Promise.resolve({ data: [] });
      if (url === "/categories/all") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Categories" }));
    expect(await screen.findByText(/no categories yet/i)).toBeTruthy();
  });
});

// ── Orders tab ────────────────────────────────────────────────────────────────

describe("ProductManagerAdmin — orders tab", () => {
  test("shows All Orders heading on orders tab", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    expect(await screen.findByText("All Orders")).toBeTruthy();
  });

  test("shows order invoice number in orders table", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    expect(await screen.findByText("INV-PM01")).toBeTruthy();
  });

  test("shows status transition button for processing orders", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    await screen.findByText("INV-PM01");
    expect(screen.getByRole("button", { name: /in transit/i })).toBeTruthy();
  });

  test("shows customer ID in the orders table", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    await screen.findByText("INV-PM01");
    expect(screen.getByText("ID: 2")).toBeTruthy();
  });

  test("shows product ID alongside product name in the orders table", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    await screen.findByText("INV-PM01");
    expect(screen.getByText("[#42]")).toBeTruthy();
  });

  test("shows 'No orders found.' when orders list is empty", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/manager") return Promise.resolve({ data: [] });
      if (url === "/categories/all") return Promise.resolve({ data: [] });
      if (url === "/orders/manager") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    expect(await screen.findByText("No orders found.")).toBeTruthy();
  });
});

// ── Comments tab ──────────────────────────────────────────────────────────────

describe("ProductManagerAdmin — comments tab", () => {
  test("shows Pending Comments heading on comments tab", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Comments" }));
    expect(await screen.findByText("Pending Comments")).toBeTruthy();
  });

  test("shows pending comment text and user name", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Comments" }));
    expect(await screen.findByText("Great product!")).toBeTruthy();
    expect(await screen.findByText("Dave")).toBeTruthy();
  });

  test("shows Approve and Reject buttons for pending comments", async () => {
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Comments" }));
    expect(await screen.findByRole("button", { name: "Approve" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Reject" })).toBeTruthy();
  });

  test("shows 'No pending comments.' when list is empty", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/products/manager") return Promise.resolve({ data: [] });
      if (url === "/categories/all") return Promise.resolve({ data: [] });
      if (url === "/reviews/pending") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<ProductManagerAdmin />, { wrapper: Wrapper });
    await screen.findByText("All Products");
    fireEvent.click(screen.getByRole("button", { name: "Comments" }));
    expect(await screen.findByText("No pending comments.")).toBeTruthy();
  });
});
