import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import type { SavedCard } from "../types";

type FormValues = {
  cardholderFullName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

interface PaymentForm {
  cardholderFullName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export default function Payment() {
  const { user } = useAuth();
  const { count, total, clearCart } = useCart();

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
  orderId: number;
  invoiceNo: string;
  total?: number;
  emailPreviewUrl?: string | null;
} | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>();

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | "new">("new");

  useEffect(() => {
    api
      .get("/users/me/cards")
      .then(({ data }) => setSavedCards(data.cards || []))
      .catch(() => {});
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  // Read address that Checkout selected
  const storedAddr = sessionStorage.getItem("checkoutAddress");
  if (count === 0 && !orderResult) return <Navigate to="/cart" replace />;
  if (!storedAddr && !orderResult) return <Navigate to="/checkout" replace />;

  function validateCard(v: string): string | true {
    return /^\d{16}$/.test(v.replace(/\s/g, ""))
      ? true
      : "Card number must be exactly 16 digits";
  }

  function validateCardholder(v: string): string | true {
    return /^[A-Za-z\s'.-]{2,}$/.test(v.trim())
      ? true
      : "Cardholder full name is required";
  }

  function validateExpiry(v: string): string | true {
    if (!/^\d{2}\/\d{2}$/.test(v)) return "Use MM/YY format";

    const [mm, yy] = v.split("/").map(Number);
    if (mm < 1 || mm > 12) return "Invalid month";

    const now = new Date();
    const fullYear = 2000 + yy;

    if (
      fullYear < now.getFullYear() ||
      (fullYear === now.getFullYear() && mm < now.getMonth() + 1)
    ) {
      return "Card has expired";
    }

    return true;
  }

  function validateCvv(v: string): string | true {
    return /^\d{3}$/.test(v) ? true : "CVV must be exactly 3 digits";
  }
  function fmtCard(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
  }
  function fmtExp(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    e.target.value = v;
  }
  function fmtCvv(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
  }

  const onSubmit = async (data: PaymentForm) => {
    setServerError("");
    setSubmitting(true);
    try {
      // Step 1: Validate payment
      const payRes = await api.post("/payment/validate", {
        cardholderFullName: data.cardholderFullName,
        cardNumber: data.cardNumber.replace(/\s/g, ""),
        expiry: data.expiry,
        cvv: data.cvv,
      });
      if (!payRes.data.ok) { setServerError(payRes.data.message); setSubmitting(false); return; }

      // Step 2: Create order (Story 16) — this decrements stock, clears cart, generates invoice
      const address = JSON.parse(storedAddr || "{}");
      const orderRes = await api.post("/orders", { address });

      sessionStorage.removeItem("checkoutAddress");
      clearCart();
      setOrderResult({
        orderId: orderRes.data.order.id,
        invoiceNo: orderRes.data.order.invoiceNo,
        total: orderRes.data.order.totalAmount,
        emailPreviewUrl: orderRes.data.emailPreviewUrl,
      });
    } catch (err: any) {
      setServerError(err.response?.data?.error || err.response?.data?.message || "Payment or order failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!orderResult) return;
    api.get(`/orders/${orderResult.orderId}/invoice`, { responseType: "blob" }).then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      clearCart();
      a.href = url;
      a.download = `${orderResult.invoiceNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Success screen
  if (orderResult) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-3">Order Confirmed</h1>
        <p className="text-sm text-brand-500 mb-1">
          Your order of <span className="font-medium text-brand-900">${orderResult.total?.toFixed(2)}</span> has been placed successfully.
        </p>
        <p className="text-xs text-brand-400 mb-6">Invoice: {orderResult.invoiceNo}</p>

        <div className="flex flex-col items-center gap-3 mb-8">
          <button onClick={handleDownloadInvoice} className="btn-secondary">
            Download Invoice PDF
          </button>
          {orderResult.emailPreviewUrl && (
            <a href={orderResult.emailPreviewUrl} target="_blank" rel="noreferrer"
              className="text-xs text-brand-500 underline underline-offset-2 hover:text-brand-900">
              Preview email (Ethereal)
            </a>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Link to="/orders" className="text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 transition-colors">View Orders</Link>
          <Link to="/" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] tracking-widest uppercase font-medium">
        <Link to="/cart" className="text-brand-400 hover:text-brand-900 transition-colors">Cart</Link>
        <Chev />
        <Link to="/checkout" className="text-brand-400 hover:text-brand-900 transition-colors">Checkout</Link>
        <Chev />
        <span className="text-brand-900">Payment</span>
      </nav>

      <h1 className="font-display text-2xl font-semibold text-brand-900 mb-2">Payment Details</h1>
      <p className="text-sm text-brand-500 mb-8">Amount due: <span className="font-medium text-brand-900">${total.toFixed(2)}</span></p>

      <div className="border border-brand-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{serverError}</div>}

          {savedCards.length > 0 && (
            <div>
              <label className="input-label">Use a Saved Card</label>
              <select
                value={selectedCardId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "new") {
                    setSelectedCardId("new");
                    setValue("cardholderFullName", "");
                    setValue("cardNumber", "");
                    setValue("expiry", "");
                    setValue("cvv", "");
                    return;
                  }
                  const id = Number(v);
                  const c = savedCards.find((x) => x.id === id);
                  if (!c) return;
                  setSelectedCardId(id);
                  // Autofill all four fields from the card itself —
                  // cardholder name is the value saved with this card,
                  // not the user's profile name.
                  setValue("cardholderFullName", c.cardholderFullName, { shouldValidate: true });
                  const formattedNumber = c.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
                  setValue("cardNumber", formattedNumber, { shouldValidate: true });
                  setValue("expiry", c.expiry, { shouldValidate: true });
                  setValue("cvv", c.cvv, { shouldValidate: true });
                }}
                className="input-field"
              >
                <option value="new">Enter a new card</option>
                {savedCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — •••• {c.last4}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="cardholderFullName" className="input-label">Cardholder Full Name</label>
            <input
              id="cardholderFullName"
              type="text"
              autoComplete="cc-name"
              placeholder="John Smith"
              className="input-field"
              {...register("cardholderFullName", {
                required: "Cardholder full name is required",
                validate: validateCardholder,
              })}
            />
            {errors.cardholderFullName && <p className="input-error">{errors.cardholderFullName.message}</p>}
          </div>

          <div>
            <label htmlFor="cardNumber" className="input-label">Card Number</label>
            <input id="cardNumber" type="text" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000"
              className="input-field font-mono tracking-[0.15em]"
              {...register("cardNumber", { required: "Required", validate: validateCard, onChange: fmtCard })} />
            {errors.cardNumber && <p className="input-error">{errors.cardNumber.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiry" className="input-label">Expiry</label>
              <input id="expiry" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                className="input-field font-mono"
                {...register("expiry", { required: "Required", validate: validateExpiry, onChange: fmtExp })} />
              {errors.expiry && <p className="input-error">{errors.expiry.message}</p>}
            </div>
            <div>
              <label htmlFor="cvv" className="input-label">Security Code</label>
              <input id="cvv" type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="000" maxLength={3}
                className="input-field font-mono"
                {...register("cvv", { required: "Required", validate: validateCvv, onChange: fmtCvv })} />
              {errors.cvv && <p className="input-error">{errors.cvv.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2 relative">
            {submitting && <span className="absolute inset-0 flex items-center justify-center"><span className="block w-4 h-4 border-2 border-brand-50 border-t-transparent rounded-full animate-spin" /></span>}
            <span className={submitting ? "opacity-0" : ""}>Pay ${total.toFixed(2)}</span>
          </button>

          <p className="text-[10px] text-brand-400 text-center leading-relaxed">
            Mock payment for demonstration. No real charges.
          </p>
        </form>
      </div>

      <Link to="/checkout" className="block text-center text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 mt-6 transition-colors">Back to Checkout</Link>
    </div>
  );
}

function Chev() {
  return <svg className="w-3 h-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
}
