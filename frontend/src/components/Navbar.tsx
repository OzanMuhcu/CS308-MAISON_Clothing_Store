import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    if (menuOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); setMobileOpen(false); }, [location.pathname]);

  const initials = user ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "";
  const isSalesManager = user?.role === "sales_manager";

  return (
    <header className="sticky top-0 z-50 bg-brand-50/95 backdrop-blur-sm border-b border-brand-200">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={isSalesManager ? "/admin" : "/"} className="font-display text-2xl font-semibold tracking-wide text-brand-900">MAISON</Link>

          <div className="hidden md:flex items-center">
            {!isSalesManager && (
              <Link to="/" className={`text-xs tracking-widest uppercase font-medium transition-colors ${location.pathname === "/" ? "text-brand-900" : "text-brand-500 hover:text-brand-900"}`}>
                Shop
              </Link>
            )}
          </div>

          <div className="flex items-center gap-5">
            {/* Wishlist icon — heart */}
            {user && !isSalesManager && (
              <Link to="/wishlist" className="relative text-brand-600 hover:text-brand-900 transition-colors" aria-label="Wishlist">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </Link>
            )}
            {/* Cart icon — clean outlined shopping bag */}
            {!isSalesManager && (
              <Link to="/cart" className="relative text-brand-600 hover:text-brand-900 transition-colors" aria-label="Cart">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-900 text-brand-50 text-[10px] font-semibold rounded-full px-1 leading-none">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div ref={dropRef} className="relative">
                <button onClick={() => setMenuOpen((p) => !p)} className="flex items-center gap-1.5 focus:outline-none" aria-expanded={menuOpen}>
                  <span className="w-8 h-8 rounded-full bg-brand-900 text-brand-50 flex items-center justify-center text-[11px] font-semibold leading-none select-none">{initials}</span>
                  <svg className={`w-3 h-3 text-brand-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-200 shadow-lg py-1 z-50">
                    {isSalesManager ? (
                      <Link to="/admin" className="block px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors">Admin</Link>
                    ) : (
                      <>
                        <Link to="/account" className="block px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors">Profile</Link>
                        <Link to="/wishlist" className="block px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors">Wishlist</Link>
                        <Link to="/orders" className="block px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors">Order History</Link>
                      </>
                    )}
                    <div className="border-t border-brand-100 my-1" />
                    <button onClick={() => { setMenuOpen(false); logout(); navigate("/"); }} className="block w-full text-left px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors">Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-xs tracking-widest uppercase font-medium text-brand-500 hover:text-brand-900 transition-colors">Sign In</Link>
            )}

            <button className="md:hidden flex flex-col gap-1.5 p-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              <span className={`block w-5 h-px bg-brand-900 transition-transform ${mobileOpen ? "rotate-45 translate-y-[4px]" : ""}`} />
              <span className={`block w-5 h-px bg-brand-900 transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-px bg-brand-900 transition-transform ${mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""}`} />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-200 py-4 flex flex-col gap-3">
            {!isSalesManager && (
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm text-brand-700">Shop</Link>
            )}
            {user && !isSalesManager && <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="text-sm text-brand-700">Wishlist</Link>}
            {user && !isSalesManager && <Link to="/account" onClick={() => setMobileOpen(false)} className="text-sm text-brand-700">Profile</Link>}
            {user && !isSalesManager && <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-sm text-brand-700">Order History</Link>}
            {user && isSalesManager && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-brand-700">Admin</Link>}
          </div>
        )}
      </nav>
    </header>
  );
}
