import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import SalesManagerRoute from "../components/SalesManagerRoute";
import ProductManagerRoute from "../components/ProductManagerRoute";

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

const guestAuth = { user: null, loading: false };
const loadingAuth = { user: null, loading: true };
const customerAuth = { user: { id: 1, name: "Alice", email: "a@b.com", role: "customer", createdAt: "" }, loading: false };
const salesManagerAuth = { user: { id: 2, name: "Bob", email: "b@b.com", role: "sales_manager", createdAt: "" }, loading: false };
const productManagerAuth = { user: { id: 3, name: "Carol", email: "c@b.com", role: "product_manager", createdAt: "" }, loading: false };

function renderInRouter(element: React.ReactNode, initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={element} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── ProtectedRoute ────────────────────────────────────────────────────────────

describe("ProtectedRoute", () => {
  test("renders children when user is authenticated", () => {
    mockUseAuth.mockReturnValue(customerAuth);
    renderInRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );
    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  test("redirects to /login when user is null", () => {
    mockUseAuth.mockReturnValue(guestAuth);
    renderInRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );
    expect(screen.queryByText("Protected Content")).toBeNull();
    expect(screen.getByText("Login Page")).toBeTruthy();
  });

  test("shows loading spinner while auth is resolving", () => {
    mockUseAuth.mockReturnValue(loadingAuth);
    const { container } = renderInRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );
    expect(screen.queryByText("Protected Content")).toBeNull();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });
});

// ── SalesManagerRoute ─────────────────────────────────────────────────────────

describe("SalesManagerRoute", () => {
  test("renders children when user is sales_manager", () => {
    mockUseAuth.mockReturnValue(salesManagerAuth);
    renderInRouter(
      <SalesManagerRoute><div>Sales Manager Area</div></SalesManagerRoute>
    );
    expect(screen.getByText("Sales Manager Area")).toBeTruthy();
  });

  test("redirects to / when user is not authenticated", () => {
    mockUseAuth.mockReturnValue(guestAuth);
    render(
      <MemoryRouter initialEntries={["/admin"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/admin" element={<SalesManagerRoute><div>Sales Manager Area</div></SalesManagerRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("Sales Manager Area")).toBeNull();
    expect(screen.getByText("Login Page")).toBeTruthy();
  });

  test("redirects to / when user role is customer", () => {
    mockUseAuth.mockReturnValue(customerAuth);
    render(
      <MemoryRouter initialEntries={["/admin"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/admin" element={<SalesManagerRoute><div>Sales Manager Area</div></SalesManagerRoute>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("Sales Manager Area")).toBeNull();
    expect(screen.getByText("Home Page")).toBeTruthy();
  });

  test("redirects to / when user role is product_manager", () => {
    mockUseAuth.mockReturnValue(productManagerAuth);
    render(
      <MemoryRouter initialEntries={["/admin"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/admin" element={<SalesManagerRoute><div>Sales Manager Area</div></SalesManagerRoute>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("Sales Manager Area")).toBeNull();
    expect(screen.getByText("Home Page")).toBeTruthy();
  });

  test("shows loading spinner while auth is resolving", () => {
    mockUseAuth.mockReturnValue(loadingAuth);
    const { container } = renderInRouter(
      <SalesManagerRoute><div>Sales Manager Area</div></SalesManagerRoute>
    );
    expect(screen.queryByText("Sales Manager Area")).toBeNull();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });
});

// ── ProductManagerRoute ───────────────────────────────────────────────────────

describe("ProductManagerRoute", () => {
  test("renders children when user is product_manager", () => {
    mockUseAuth.mockReturnValue(productManagerAuth);
    renderInRouter(
      <ProductManagerRoute><div>PM Area</div></ProductManagerRoute>
    );
    expect(screen.getByText("PM Area")).toBeTruthy();
  });

  test("redirects to /login when user is null", () => {
    mockUseAuth.mockReturnValue(guestAuth);
    renderInRouter(
      <ProductManagerRoute><div>PM Area</div></ProductManagerRoute>
    );
    expect(screen.queryByText("PM Area")).toBeNull();
    expect(screen.getByText("Login Page")).toBeTruthy();
  });

  test("redirects to / when user role is customer", () => {
    mockUseAuth.mockReturnValue(customerAuth);
    render(
      <MemoryRouter initialEntries={["/pm"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/pm" element={<ProductManagerRoute><div>PM Area</div></ProductManagerRoute>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("PM Area")).toBeNull();
    expect(screen.getByText("Home Page")).toBeTruthy();
  });

  test("redirects to / when user role is sales_manager", () => {
    mockUseAuth.mockReturnValue(salesManagerAuth);
    render(
      <MemoryRouter initialEntries={["/pm"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/pm" element={<ProductManagerRoute><div>PM Area</div></ProductManagerRoute>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("PM Area")).toBeNull();
    expect(screen.getByText("Home Page")).toBeTruthy();
  });
});
