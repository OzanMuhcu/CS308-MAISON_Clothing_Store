import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import type { OrderAddress, SavedAddress } from "../types";

const EMPTY_ADDRESS: OrderAddress = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "",
};

type AddressMode = "saved" | "new";

export default function Checkout() {
  const { user } = useAuth();
  const { items, count, total } = useCart();
  const navigate = useNavigate();

  // User's persisted saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<number | null>(null);
  // Whether the user wants to use their saved address or enter a new one
  const [mode, setMode] = useState<AddressMode>("saved");
  // The one-time address form state
  const [newAddress, setNewAddress] = useState<OrderAddress>({
    ...EMPTY_ADDRESS,
    fullName: user?.name ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OrderAddress, string>>>({});
  const [loadingAddress, setLoadingAddress] = useState(true);

  if (!user) return <Navigate to="/login" replace />;

  if (count === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-4">
          Checkout
        </h1>
        <p className="text-sm text-brand-500 mb-6">Your cart is empty.</p>
        <Link to="/" className="btn-primary">
          Browse Collection
        </Link>
      </div>
    );
  }

  // Fetch the user's saved default address once on mount
  useEffect(() => {
    api
      .get("/users/me/addresses")
      .then(({ data }) => {
        const addresses: SavedAddress[] = data.addresses || [];
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          setSelectedSavedAddressId(addresses[0].id);
          setMode("saved");
        } else {
          setMode("new");
        }
      })
      .catch(() => {
        // No address saved yet or network error — fall through to new address form
        setMode("new");
      })
      .finally(() => setLoadingAddress(false));
  }, []);

  /**
   * The address that will actually be stored in sessionStorage and sent to
   * POST /orders.  When mode is "saved" we use the fetched default; when
   * "new" we use the form state.
   */
  const activeAddress: OrderAddress =
    mode === "saved" && selectedSavedAddressId
      ? savedAddresses.find((a) => a.id === selectedSavedAddressId) || newAddress
      : newAddress;

  const selectedSavedAddress = selectedSavedAddressId
    ? savedAddresses.find((a) => a.id === selectedSavedAddressId) || null
    : null;

  const validate = (): boolean => {
    // If using the saved address it was already validated on the Account page
    if (mode === "saved" && selectedSavedAddressId) return true;

    const e: Partial<Record<keyof OrderAddress, string>> = {};
    if (!newAddress.fullName.trim())    e.fullName    = "Required";
    if (!newAddress.line1.trim())       e.line1       = "Required";
    if (!newAddress.city.trim())        e.city        = "Required";
    if (!/^\d{5}$/.test(newAddress.postalCode.trim())) {
      e.postalCode = "Postal code must be exactly 5 digits.";
    }
    if (!newAddress.country.trim())     e.country     = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    // Store the chosen address for Payment.tsx to read
    sessionStorage.setItem("checkoutAddress", JSON.stringify(activeAddress));
    navigate("/payment");
  };

  const field = (
    key: keyof OrderAddress,
    label: string,
    placeholder: string,
    optional = false,
  ) => (
    <div>
      <label className="input-label">
        {label}
        {optional && <span className="text-brand-400 ml-1">(optional)</span>}
      </label>
      <input
        type="text"
        value={newAddress[key] ?? ""}
        onChange={(e) => {
          const nextValue =
            key === "postalCode"
              ? e.target.value.replace(/\D/g, "").slice(0, 5)
              : e.target.value;
          setNewAddress((prev) => ({ ...prev, [key]: nextValue }));
        }}
        placeholder={placeholder}
        className={
          key === "postalCode"
            ? "input-field font-mono tracking-[0.15em]"
            : "input-field"
        }
        inputMode={key === "postalCode" ? "numeric" : undefined}
        maxLength={key === "postalCode" ? 5 : undefined}
      />
      {errors[key] && <p className="input-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] tracking-widest uppercase font-medium">
        <Link
          to="/cart"
          className="text-brand-400 hover:text-brand-900 transition-colors"
        >
          Cart
        </Link>
        <Chev />
        <span className="text-brand-900">Checkout</span>
        <Chev />
        <span className="text-brand-300">Payment</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Address selection */}
        <div className="lg:col-span-3">
          <h1 className="font-display text-2xl font-semibold text-brand-900 mb-6">
            Delivery Address
          </h1>

          {loadingAddress ? (
            <p className="text-sm text-brand-400">Loading your saved address…</p>
          ) : (
            <>
              {/*
               * Mode selector — only rendered when the user already has a
               * saved default address.  When there is no saved address we go
               * straight to the one-time form.
               */}
              {savedAddresses.length > 0 && (
                <div className="mb-6 border border-brand-200 divide-y divide-brand-100">
                  {/* Option A: use saved default address */}
                  <label className="flex items-start gap-3 px-4 py-4 cursor-pointer">
                    <input
                      type="radio"
                      name="addressMode"
                      checked={mode === "saved"}
                      onChange={() => {
                        setMode("saved");
                        setErrors({});
                      }}
                      className="mt-0.5 accent-brand-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-brand-900">
                        Use a saved address
                      </p>
                      <div className="mt-2 space-y-2">
                        <select
                          value={selectedSavedAddressId ?? ""}
                          onChange={(e) => setSelectedSavedAddressId(Number(e.target.value))}
                          className="input-field"
                        >
                          {savedAddresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label}
                            </option>
                          ))}
                        </select>
                        {selectedSavedAddress && (
                          <p className="text-xs text-brand-500 mt-0.5">
                            {selectedSavedAddress.fullName} &middot; {selectedSavedAddress.line1}
                            {selectedSavedAddress.line2 ? `, ${selectedSavedAddress.line2}` : ""},&nbsp;
                            {selectedSavedAddress.city} {selectedSavedAddress.postalCode}, {selectedSavedAddress.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Option B: enter a different address for this order only */}
                  <label className="flex items-start gap-3 px-4 py-4 cursor-pointer">
                    <input
                      type="radio"
                      name="addressMode"
                      checked={mode === "new"}
                      onChange={() => setMode("new")}
                      className="mt-0.5 accent-brand-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-brand-900">
                        Use a different address
                      </p>
                      <p className="text-xs text-brand-500 mt-0.5">
                        Enter a one-time delivery address for this order only
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* One-time address form — shown when no saved address exists OR user chose "new" */}
              {(savedAddresses.length === 0 || mode === "new") && (
                <div className="space-y-4">
                  {field("fullName",   "Full Name",      "John Smith")}
                  {field("line1",      "Address Line 1", "123 Main Street")}
                  {field("line2",      "Address Line 2", "Apt 4B", true)}
                  <div className="grid grid-cols-2 gap-4">
                    {field("city",       "City",           "Istanbul")}
                    {field("postalCode", "Postal Code",    "00000")}
                  </div>
                  {field("country",    "Country",        "Turkey")}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-2">
          <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-4">
            Order Summary
          </h2>
          <div className="border border-brand-200">
            <div className="divide-y divide-brand-100 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="w-10 h-12 bg-brand-100 flex-shrink-0 overflow-hidden">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-brand-400">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-brand-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
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
                <span className="text-xs tracking-wider uppercase font-medium text-brand-900">
                  Total
                </span>
                <span className="text-base font-display font-semibold text-brand-900">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn-primary w-full mt-5"
            onClick={handleContinue}
          >
            Continue to Payment
          </button>
          <Link
            to="/cart"
            className="block text-center text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 mt-3 transition-colors"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

function Chev() {
  return (
    <svg
      className="w-3 h-3 text-brand-300"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
