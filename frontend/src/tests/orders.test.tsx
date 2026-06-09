import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Orders from "../pages/Orders";
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

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {children}
    </MemoryRouter>
  );
}

const makeOrder = (overrides: Partial<typeof baseOrder> = {}) => ({
  ...baseOrder,
  ...overrides,
});

const baseOrder = {
  id: 1,
  invoiceNo: "INV-0001",
  totalAmount: 99.99,
  status: "processing",
  createdAt: new Date().toISOString(),
  items: [{ id: 1, productId: 1, productName: "Classic Shirt", unitPrice: 49.99, quantity: 2, lineTotal: 99.98 }],
  address: { fullName: "Alice", line1: "1 Main St", city: "Istanbul", postalCode: "34000", country: "Turkey" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/orders") return Promise.resolve({ data: [baseOrder] });
    if (url === "/orders/refunds") return Promise.resolve({ data: [] });
    return Promise.resolve({ data: [] });
  });
});

// ── Order list rendering ──────────────────────────────────────────────────────

describe("Orders page — list rendering", () => {
  test("renders Order History heading", async () => {
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("Order History")).toBeTruthy();
  });

  test("renders invoice number for each order", async () => {
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("INV-0001")).toBeTruthy();
  });

  test("renders formatted total amount", async () => {
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("$99.99")).toBeTruthy();
  });

  test("renders order line items as summary text", async () => {
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText(/Classic Shirt x2/)).toBeTruthy();
  });

  test("renders Download Invoice PDF link", async () => {
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("Download Invoice PDF")).toBeTruthy();
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("Orders page — empty state", () => {
  test("shows 'No orders yet' when order list is empty", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("No orders yet")).toBeTruthy();
  });

  test("shows Start Shopping link in empty state", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("Start Shopping")).toBeTruthy();
  });
});

// ── Status labels ─────────────────────────────────────────────────────────────

describe("Orders page — status labels", () => {
  test("shows 'processing' status label for a processing order", async () => {
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("processing")).toBeTruthy();
  });

  test("shows 'In transit' label for in_transit orders", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [makeOrder({ status: "in_transit" })] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("In transit")).toBeTruthy();
  });

  test("shows 'delivered' status label for delivered orders", async () => {
    const recentDate = new Date().toISOString();
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [makeOrder({ status: "delivered", createdAt: recentDate })] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("delivered")).toBeTruthy();
  });

  test("shows 'Cancelled' label for cancelled orders", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [makeOrder({ status: "cancelled" })] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("Cancelled")).toBeTruthy();
  });
});

// ── Cancel button ─────────────────────────────────────────────────────────────

describe("Orders page — cancel button", () => {
  test("shows Cancel Order button for processing orders", async () => {
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByRole("button", { name: /cancel order/i })).toBeTruthy();
  });

  test("does not show Cancel Order button for in_transit orders", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [makeOrder({ status: "in_transit" })] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    await screen.findByText("INV-0001");
    expect(screen.queryByRole("button", { name: /cancel order/i })).toBeNull();
  });

  test("does not show Cancel Order button for delivered orders", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [makeOrder({ status: "delivered" })] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    await screen.findByText("INV-0001");
    expect(screen.queryByRole("button", { name: /cancel order/i })).toBeNull();
  });

  test("updates order status optimistically after successful cancel", async () => {
    mockApi.post.mockResolvedValue({
      data: { order: makeOrder({ status: "cancelled" }) },
    });
    render(<Orders />, { wrapper: Wrapper });
    const cancelBtn = await screen.findByRole("button", { name: /cancel order/i });
    fireEvent.click(cancelBtn);
    expect(await screen.findByText("Cancelled")).toBeTruthy();
  });
});

// ── Refund button ─────────────────────────────────────────────────────────────

describe("Orders page — refund button", () => {
  test("shows Request Refund button for recent delivered orders without existing refund", async () => {
    const recentDate = new Date().toISOString();
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [makeOrder({ status: "delivered", createdAt: recentDate })] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByRole("button", { name: /request refund/i })).toBeTruthy();
  });

  test("shows 'Refund window closed' for delivered orders older than 30 days", async () => {
    const oldDate = new Date(Date.now() - 31 * 86_400_000).toISOString();
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [makeOrder({ status: "delivered", createdAt: oldDate })] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText("Refund window closed")).toBeTruthy();
  });

  test("shows pending refund status when refund request exists for the order", async () => {
    const recentDate = new Date().toISOString();
    const deliveredOrder = makeOrder({ status: "delivered", createdAt: recentDate });
    const refundRequest = { id: 10, orderId: 1, status: "pending", createdAt: recentDate };
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [deliveredOrder] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [refundRequest] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText(/refund pending/i)).toBeTruthy();
  });

  test("shows approved refund status when refund is approved", async () => {
    const recentDate = new Date().toISOString();
    const deliveredOrder = makeOrder({ status: "delivered", createdAt: recentDate });
    const refundRequest = { id: 10, orderId: 1, status: "approved", createdAt: recentDate };
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/orders") return Promise.resolve({ data: [deliveredOrder] });
      if (url === "/orders/refunds") return Promise.resolve({ data: [refundRequest] });
      return Promise.resolve({ data: [] });
    });
    render(<Orders />, { wrapper: Wrapper });
    expect(await screen.findByText(/refund approved/i)).toBeTruthy();
  });
});
