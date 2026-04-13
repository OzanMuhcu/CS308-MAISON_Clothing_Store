/**
 * CHECKOUT PAGE — Sprint 3
 *
 * DEV-22: New Checkout page connected to Cart's "Proceed to Payment" button
 * DEV-23: Reuses current cart data to show order summary before payment
 * DEV-24: Cart logic stays intact — cart is cleared only after order confirmation
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Checkout() {
  const { items, count, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    address: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Place Order ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    const fullAddress = `${formData.fullName}, ${formData.address}, ${formData.city} ${formData.zipCode}`.trim();
    if (fullAddress.length < 10) {
      setError("Please fill in all address fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      // DEV-24: Cart stays intact until backend confirms order
      const { data } = await api.post("/orders", {
        shippingAddress: fullAddress,
      });

      // Order confirmed — NOW clear the frontend cart
      clearCart();
      setOrderSuccess(data.id);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Guard: not logged in ──────────────────────────────
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-4">
          Checkout
        </h1>
        <p className="text-sm text-brand-500 mb-6">
          You need to sign in before placing an order.
        </p>
        <Link to="/login" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  // ─── Order Success Screen ──────────────────────────────
  if (orderSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
          ✓
        </div>
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-sm text-brand-500 mb-1">
          Your order <strong>#{orderSuccess}</strong> has been placed successfully.
        </p>
        <p className="text-sm text-brand-400 mb-8">
          We'll send you an email when your items ship.
        </p>
        <Link to="/" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  // ─── Guard: empty cart ─────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-4">
          Checkout
        </h1>
        <p className="text-sm text-brand-500 mb-6">
          Your cart is empty. Add some items first.
        </p>
        <Link to="/" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  // ─── Checkout Form + Order Summary ─────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-10">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Shipping & Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Shipping Section */}
          <div>
            <h2 className="text-xs tracking-widest uppercase text-brand-400 font-medium mb-4">
              Shipping Information
            </h2>
            <div className="space-y-4">
              <input
                name="fullName"
                value={formData.fullName}
                placeholder="Full Name"
                required
                onChange={handleChange}
                className="w-full border-b border-brand-200 py-3 outline-none text-sm focus:border-brand-900 transition-colors bg-transparent"
              />
              <input
                name="address"
                value={formData.address}
                placeholder="Street Address"
                required
                onChange={handleChange}
                className="w-full border-b border-brand-200 py-3 outline-none text-sm focus:border-brand-900 transition-colors bg-transparent"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="city"
                  value={formData.city}
                  placeholder="City"
                  required
                  onChange={handleChange}
                  className="border-b border-brand-200 py-3 outline-none text-sm focus:border-brand-900 transition-colors bg-transparent"
                />
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  placeholder="ZIP Code"
                  required
                  onChange={handleChange}
                  className="border-b border-brand-200 py-3 outline-none text-sm focus:border-brand-900 transition-colors bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div>
            <h2 className="text-xs tracking-widest uppercase text-brand-400 font-medium mb-4">
              Payment Details
            </h2>
            <div className="space-y-4">
              <input
                name="cardNumber"
                value={formData.cardNumber}
                placeholder="Card Number"
                maxLength={16}
                required
                onChange={handleChange}
                className="w-full border-b border-brand-200 py-3 outline-none text-sm focus:border-brand-900 transition-colors bg-transparent"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="expiryDate"
                  value={formData.expiryDate}
                  placeholder="MM / YY"
                  maxLength={5}
                  required
                  onChange={handleChange}
                  className="border-b border-brand-200 py-3 outline-none text-sm focus:border-brand-900 transition-colors bg-transparent"
                />
                <input
                  name="cvv"
                  value={formData.cvv}
                  placeholder="CVV"
                  maxLength={4}
                  required
                  onChange={handleChange}
                  className="border-b border-brand-200 py-3 outline-none text-sm focus:border-brand-900 transition-colors bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-900 text-white py-4 text-sm tracking-wide uppercase hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : `Place Order — $${total.toFixed(2)}`}
          </button>

          {/* Back to Cart (DEV-24: preserves cart) */}
          <Link
            to="/cart"
            className="block text-center text-xs text-brand-400 hover:text-brand-600 mt-2"
          >
            ← Back to Cart
          </Link>
        </form>

        {/* Right: Order Summary (DEV-23 — reuses cart data) */}
        <div className="bg-brand-50 p-6 h-fit rounded lg:sticky lg:top-24">
          <h2 className="text-xs tracking-widest uppercase text-brand-400 font-medium mb-6">
            Order Summary
          </h2>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                {/* Product thumbnail */}
                <div className="w-16 h-20 bg-brand-100 overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-300 text-xs">
                      No img
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-brand-400 mt-0.5">
                    Qty: {item.quantity}
                  </p>
                </div>

                {/* Line total */}
                <p className="text-sm font-medium text-brand-900 flex-shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-brand-200 mt-6 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-brand-500">
              <span>Subtotal ({count} {count === 1 ? "item" : "items"})</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-500">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-brand-900 pt-2 border-t border-brand-200">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}