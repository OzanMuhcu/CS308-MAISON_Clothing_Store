import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { OrderAddress } from "../types";

const EMPTY_ADDRESS: OrderAddress = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "",
};

export default function Account() {
  const { user } = useAuth();
  const [address, setAddress] = useState<OrderAddress>(EMPTY_ADDRESS);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof OrderAddress, string>>>({});

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roles: Record<string, string> = {
    customer: "Customer",
    sales_manager: "Sales Manager",
    product_manager: "Product Manager",
  };

  // Load the user's saved default address on mount
  useEffect(() => {
    api
      .get("/users/me/address")
      .then(({ data }) => {
        if (data.defaultAddress) {
          setAddress({ ...EMPTY_ADDRESS, ...data.defaultAddress });
        }
      })
      .catch(() => {
        // silently ignore — address stays empty, user can fill it in
      })
      .finally(() => setLoadingAddress(false));
  }, []);

  const validate = (): boolean => {
    const e: Partial<Record<keyof OrderAddress, string>> = {};
    if (!address.fullName.trim()) e.fullName = "Required";
    if (!address.line1.trim())    e.line1    = "Required";
    if (!address.city.trim())     e.city     = "Required";
    if (!address.postalCode.trim()) e.postalCode = "Required";
    if (!address.country.trim())  e.country  = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setStatus("idle");
    try {
      await api.put("/users/me/address", address);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
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
        value={address[key] ?? ""}
        onChange={(e) =>
          setAddress((prev) => ({ ...prev, [key]: e.target.value }))
        }
        placeholder={placeholder}
        className="input-field"
      />
      {errors[key] && <p className="input-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 rounded-full bg-brand-900 text-brand-50 flex items-center justify-center font-display text-lg font-semibold">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">
            {user.name}
          </h1>
          <p className="text-sm text-brand-500">{user.email}</p>
        </div>
      </div>

      {/* Account Details */}
      <section className="mb-10">
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">
          Account Details
        </h2>
        <div className="border border-brand-200 divide-y divide-brand-100">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Account Type" value={roles[user.role] || user.role} />
          <Row
            label="Member Since"
            value={new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </div>
      </section>

      {/* Default Delivery Address — Story 14 */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">
          Default Delivery Address
        </h2>

        {loadingAddress ? (
          <div className="border border-brand-200 p-6 text-sm text-brand-400">
            Loading address…
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="border border-brand-200 p-6 space-y-4"
            noValidate
          >
            {field("fullName",   "Full Name",       "John Smith")}
            {field("line1",      "Address Line 1",  "123 Main Street")}
            {field("line2",      "Address Line 2",  "Apt 4B", true)}
            <div className="grid grid-cols-2 gap-4">
              {field("city",       "City",            "Istanbul")}
              {field("postalCode", "Postal Code",     "34000")}
            </div>
            {field("country",    "Country",         "Turkey")}

            <div className="flex items-center gap-4 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Save Address"}
              </button>
              {status === "saved" && (
                <span className="text-sm text-green-600">
                  Address saved successfully.
                </span>
              )}
              {status === "error" && (
                <span className="text-sm text-red-600">
                  Failed to save. Please try again.
                </span>
              )}
            </div>

            <p className="text-xs text-brand-400">
              This address will be pre-filled at checkout. You can always use a
              different address for a specific order.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-5 py-3.5">
      <span className="text-xs tracking-wider uppercase text-brand-500 font-medium">
        {label}
      </span>
      <span className="text-sm text-brand-900">{value}</span>
    </div>
  );
}
