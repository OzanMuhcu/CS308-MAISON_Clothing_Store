import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";

interface PaymentForm { cardNumber: string; expiry: string; cvv: string; }

export default function Payment() {
  const { user } = useAuth();
  const { count, total } = useCart();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentForm>();

  if (!user) return <Navigate to="/login" replace />;
  if (count === 0 && !success) return <Navigate to="/cart" replace />;

  function validateCardNumber(v: string): string | true {
    const d = v.replace(/\s/g, "");
    return /^\d{16}$/.test(d) ? true : "Card number must be exactly 16 digits";
  }
  function validateExpiry(v: string): string | true {
    if (!/^\d{2}\/\d{2}$/.test(v)) return "Use MM/YY format";
    const [mm, yy] = v.split("/").map(Number);
    if (mm < 1 || mm > 12) return "Invalid month";
    const now = new Date();
    const ey = 2000 + yy;
    if (ey < now.getFullYear() || (ey === now.getFullYear() && mm < now.getMonth() + 1)) return "Card has expired";
    return true;
  }
  function validateCvv(v: string): string | true {
    return /^\d{3}$/.test(v) ? true : "CVV must be exactly 3 digits";
  }
  function formatCard(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    e.target.value = v;
  }
  function formatExpiry(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    e.target.value = v;
  }

  const onSubmit = async (data: PaymentForm) => {
    setServerError("");
    setSubmitting(true);
    try {
      const res = await api.post("/payment/validate", {
        cardNumber: data.cardNumber.replace(/\s/g, ""), expiry: data.expiry, cvv: data.cvv,
      });
      if (res.data.ok) setSuccess(true);
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Payment validation failed. Please check your details.");
    } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-3">Payment Accepted</h1>
        <p className="text-sm text-brand-500 mb-2">Your payment of <span className="font-medium text-brand-900">${total.toFixed(2)}</span> was validated successfully.</p>
        <p className="text-xs text-brand-400 mb-8">Order confirmation and invoice will be available in a future update.</p>
        <Link to="/" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] tracking-widest uppercase font-medium">
        <Link to="/cart" className="text-brand-400 hover:text-brand-900 transition-colors">Cart</Link>
        <svg className="w-3 h-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        <Link to="/checkout" className="text-brand-400 hover:text-brand-900 transition-colors">Checkout</Link>
        <svg className="w-3 h-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        <span className="text-brand-900">Payment</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-2">Payment Details</h1>
      <p className="text-sm text-brand-500 mb-8">
        Amount due: <span className="font-medium text-brand-900">${total.toFixed(2)}</span>
      </p>

      <div className="border border-brand-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{serverError}</div>
          )}

          <div>
            <label htmlFor="cardNumber" className="input-label">Card Number</label>
            <input id="cardNumber" type="text" inputMode="numeric" autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              className="input-field font-mono tracking-[0.15em]"
              {...register("cardNumber", { required: "Card number is required", validate: validateCardNumber, onChange: formatCard })} />
            {errors.cardNumber && <p className="input-error">{errors.cardNumber.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiry" className="input-label">Expiry Date</label>
              <input id="expiry" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                className="input-field font-mono"
                {...register("expiry", { required: "Expiry is required", validate: validateExpiry, onChange: formatExpiry })} />
              {errors.expiry && <p className="input-error">{errors.expiry.message}</p>}
            </div>
            <div>
              <label htmlFor="cvv" className="input-label">Security Code</label>
              <input id="cvv" type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="000" maxLength={3}
                className="input-field font-mono"
                {...register("cvv", { required: "CVV is required", validate: validateCvv })} />
              {errors.cvv && <p className="input-error">{errors.cvv.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2 relative">
            {submitting && (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="block w-4 h-4 border-2 border-brand-50 border-t-transparent rounded-full animate-spin" />
              </span>
            )}
            <span className={submitting ? "opacity-0" : ""}>Pay ${total.toFixed(2)}</span>
          </button>

          <p className="text-[10px] text-brand-400 text-center leading-relaxed">
            This is a mock payment for demonstration purposes. No real charges will be made and card data is never stored.
          </p>
        </form>
      </div>

      <Link to="/checkout" className="block text-center text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 mt-6 transition-colors">
        Back to Checkout
      </Link>
    </div>
  );
}
