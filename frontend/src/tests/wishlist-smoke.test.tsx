import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Wishlist from "../pages/Wishlist";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from "../services/api";
const mockApi = api as any;

// ── Fixture ───────────────────────────────────────────────────────────────────

const mockWishlists = [
  { id: 1, name: "Summer Picks", itemCount: 3 },
  { id: 2, name: "Winter Essentials", itemCount: 0 },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

// ── Default: API returns empty list ───────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/wishlists") return Promise.resolve({ data: [] });
    return Promise.resolve({ data: [] });
  });
});

// ── Wishlist page — empty state ───────────────────────────────────────────────

describe("Wishlist page — empty state", () => {
  test("renders My Wishlists heading after lists load", async () => {
    render(<Wishlist />, { wrapper: Wrapper });
    // Heading is hidden while loadingLists=true; wait for the API to resolve.
    expect(await screen.findByRole("heading", { name: /my wishlists/i })).toBeTruthy();
  });

  test("shows empty-state message when no wishlists exist", async () => {
    render(<Wishlist />, { wrapper: Wrapper });
    await screen.findByRole("heading", { name: /my wishlists/i });
    expect(screen.getByText(/create a wishlist to start saving items/i)).toBeTruthy();
  });

  test("renders Create Wishlist submit button", async () => {
    render(<Wishlist />, { wrapper: Wrapper });
    await screen.findByRole("heading", { name: /my wishlists/i });
    expect(screen.getByRole("button", { name: /create wishlist/i })).toBeTruthy();
  });

  test("shows inline error when Create Wishlist is submitted with empty name", async () => {
    render(<Wishlist />, { wrapper: Wrapper });
    await screen.findByRole("heading", { name: /my wishlists/i });
    fireEvent.click(screen.getByRole("button", { name: /create wishlist/i }));
    await waitFor(() => {
      expect(screen.getByText(/wishlist name is required/i)).toBeTruthy();
    });
  });
});

// ── Wishlist page — with existing lists ──────────────────────────────────────

describe("Wishlist page — existing wishlists", () => {
  beforeEach(() => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/wishlists") return Promise.resolve({ data: mockWishlists });
      // Items for any list (empty for simplicity)
      return Promise.resolve({ data: [] });
    });
  });

  test("renders Select Wishlist dropdown with list names", async () => {
    render(<Wishlist />, { wrapper: Wrapper });
    await screen.findByRole("heading", { name: /my wishlists/i });
    expect(screen.getByRole("option", { name: /summer picks/i })).toBeTruthy();
    expect(screen.getByRole("option", { name: /winter essentials/i })).toBeTruthy();
  });

  test("renders Delete this wishlist button when lists exist", async () => {
    render(<Wishlist />, { wrapper: Wrapper });
    await screen.findByRole("heading", { name: /my wishlists/i });
    expect(screen.getByRole("button", { name: /delete this wishlist/i })).toBeTruthy();
  });
});
