import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-xs tracking-widest uppercase font-medium transition-colors duration-200 ${
        isActive(to) ? "text-brand-900" : "text-brand-500 hover:text-brand-900"
      }`}
      onClick={() => setMobileOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-brand-50/95 backdrop-blur-sm border-b border-brand-200">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-display text-2xl font-semibold tracking-wide text-brand-900">
            MAISON
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLink("/", "Shop")}
            {user && navLink("/account", "Account")}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-6">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative text-xs tracking-widest uppercase font-medium text-brand-500 hover:text-brand-900 transition-colors"
            >
              Cart
              {count > 0 && (
                <span className="absolute -top-2 -right-4 w-5 h-5 flex items-center justify-center bg-brand-900 text-brand-50 text-[10px] font-semibold rounded-full">
                  {count}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <button
                onClick={logout}
                className="text-xs tracking-widest uppercase font-medium text-brand-500 hover:text-brand-900 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs tracking-widest uppercase font-medium text-brand-500 hover:text-brand-900 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden flex flex-col gap-1 p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span className={`block w-5 h-px bg-brand-900 transition-transform ${mobileOpen ? "rotate-45 translate-y-[3px]" : ""}`} />
              <span className={`block w-5 h-px bg-brand-900 transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-px bg-brand-900 transition-transform ${mobileOpen ? "-rotate-45 -translate-y-[3px]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-200 py-4 flex flex-col gap-4">
            {navLink("/", "Shop")}
            {user && navLink("/account", "Account")}
          </div>
        )}
      </nav>
    </header>
  );
}
