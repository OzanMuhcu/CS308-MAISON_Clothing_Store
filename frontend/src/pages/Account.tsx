import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { OrderAddress, SavedAddress } from "../types";

type AddressForm = OrderAddress & { label: string };

const EMPTY_ADDRESS: AddressForm = {
  label: "",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "",
};

export default function Account() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

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
      .get("/users/me/addresses")
      .then(({ data }) => {
        const loaded: SavedAddress[] = data.addresses || [];
        setAddresses(loaded);
        if (loaded.length > 0) {
          setSelectedAddressId(loaded[0].id);
          setAddress({ ...loaded[0] });
        } else {
          setSelectedAddressId("new");
          setAddress(EMPTY_ADDRESS);
        }
      })
      .catch(() => {
        // silently ignore — address stays empty, user can fill it in
      })
      .finally(() => setLoadingAddress(false));
  }, []);

  const validate = (): boolean => {
    const e: Partial<Record<keyof AddressForm, string>> = {};
    if (!address.label.trim()) e.label = "Address label is required";
    const duplicate = addresses.some(
      (a) =>
        a.label.toLowerCase() === address.label.trim().toLowerCase() &&
        (selectedAddressId === "new" || a.id !== selectedAddressId)
    );
    if (duplicate) e.label = "Address label must be unique.";
    if (!address.fullName.trim()) e.fullName = "Required";
    if (!address.line1.trim())    e.line1    = "Required";
    if (!address.city.trim())     e.city     = "Required";
    if (!/^\d{5}$/.test(address.postalCode.trim())) {
      e.postalCode = "Postal code must be exactly 5 digits.";
    }
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
      const payload = {
        label: address.label.trim(),
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
      };

      const { data } =
        selectedAddressId === "new"
          ? await api.post("/users/me/addresses", payload)
          : await api.put(`/users/me/addresses/${selectedAddressId}`, payload);

      const saved: SavedAddress = data.address;
      setAddresses((prev) => {
        const idx = prev.findIndex((a) => a.id === saved.id);
        if (idx === -1) return [saved, ...prev];
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
      setSelectedAddressId(saved.id);
      setAddress({ ...saved });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof AddressForm,
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
        onChange={(e) => {
          const nextValue =
            key === "postalCode"
              ? e.target.value.replace(/\D/g, "").slice(0, 5)
              : e.target.value;
          setAddress((prev) => ({ ...prev, [key]: nextValue }));
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
            <div>
              <label className="input-label">Saved Addresses</label>
              <select
                value={selectedAddressId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "new") {
                    setSelectedAddressId("new");
                    setAddress(EMPTY_ADDRESS);
                    setErrors({});
                    return;
                  }
                  const id = Number(value);
                  const selected = addresses.find((a) => a.id === id);
                  if (!selected) return;
                  setSelectedAddressId(id);
                  setAddress({ ...selected });
                  setErrors({});
                }}
                className="input-field"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
                <option value="new">+ Add New Address</option>
              </select>
              <p className="text-xs text-brand-400 mt-2">
                {selectedAddressId === "new" ? "Creating a new saved address" : "Updating selected saved address"}
              </p>
            </div>

            {field("label", "Address Label", "Home 1")}
            {field("fullName",   "Full Name",       "John Smith")}
            {field("line1",      "Address Line 1",  "123 Main Street")}
            {field("line2",      "Address Line 2",  "Apt 4B", true)}
            <div className="grid grid-cols-2 gap-4">
              {field("city",       "City",            "Istanbul")}
              {field("postalCode", "Postal Code",     "00000")}
            </div>
            {field("country",    "Country",         "Turkey")}

            <div className="flex items-center gap-4 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : selectedAddressId === "new" ? "Save" : "Update"}
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
