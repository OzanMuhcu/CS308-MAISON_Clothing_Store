import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { user } = useAuth();
  const { items, count, total } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: user?.name || "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return <Navigate to="/login" replace />;
  if (count === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-4">Checkout</h1>
        <p className="text-sm text-brand-500 mb-6">Your cart is empty.</p>
        <Link to="/" className="btn-primary">Browse Collection</Link>
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.fullName.trim()) e.fullName = "Required";
    if (!address.line1.trim()) e.line1 = "Required";
    if (!address.city.trim()) e.city = "Required";
    if (!address.postalCode.trim()) e.postalCode = "Required";
    if (!address.country.trim()) e.country = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    // Store address in sessionStorage so Payment page can read it
    sessionStorage.setItem("checkoutAddress", JSON.stringify(address));
    navigate("/payment");
  };

  const field = (key: keyof typeof address, label: string, placeholder: string, span?: string) => (
    <div className={span}>
      <label className="input-label">{label}</label>
      <input
        type="text"
        value={address[key]}
        onChange={(e) => setAddress((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="input-field"
      />
      {errors[key] && <p className="input-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] tracking-widest uppercase font-medium">
        <Link to="/cart" className="text-brand-400 hover:text-brand-900 transition-colors">Cart</Link>
        <Chev />
        <span className="text-brand-900">Checkout</span>
        <Chev />
        <span className="text-brand-300">Payment</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Address */}
        <div className="lg:col-span-3">
          <h1 className="font-display text-2xl font-semibold text-brand-900 mb-6">Delivery Address</h1>
          <div className="space-y-4">
            {field("fullName", "Full Name", "John Smith")}
            {field("line1", "Address Line 1", "123 Main Street")}
            {field("line2", "Address Line 2 (optional)", "Apt 4B")}
            <div className="grid grid-cols-2 gap-4">
              {field("city", "City", "Istanbul")}
              {field("postalCode", "Postal Code", "34000")}
            </div>
            {field("country", "Country", "Turkey")}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-2">
          <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-4">Order Summary</h2>
          <div className="border border-brand-200">
            <div className="divide-y divide-brand-100 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-12 bg-brand-100 flex-shrink-0 overflow-hidden">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-brand-400">Qty {item.quantity}</p>
                  </div>
                  <p className="text-xs font-medium text-brand-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-200 px-4 py-3 space-y-2">
              <div className="flex justify-between text-xs text-brand-500">
                <span>Subtotal ({count})</span>
                <span className="text-brand-900">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-brand-500">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-brand-200 pt-2 flex justify-between">
                <span className="text-xs tracking-wider uppercase font-medium text-brand-900">Total</span>
                <span className="text-base font-display font-semibold text-brand-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full mt-5" onClick={handleContinue}>
            Continue to Payment
          </button>
          <Link to="/cart" className="block text-center text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 mt-3 transition-colors">
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

function Chev() {
  return <svg className="w-3 h-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
}
