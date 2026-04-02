import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Login from "../pages/Login";
import Register from "../pages/Register";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

describe("Login page", () => {
  test("renders sign in heading and form fields", () => {
    render(<Login />, { wrapper: Wrapper });
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });
});

describe("Register page", () => {
  test("renders create account heading and form fields", () => {
    render(<Register />, { wrapper: Wrapper });
    expect(screen.getByRole("heading", { name: "Create Account" })).toBeTruthy();
    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
  });
});
