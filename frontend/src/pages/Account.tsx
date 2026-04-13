import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { user } = useAuth();
  const [address, setAddress] = useState({ street: "", city: "", zip: "" });
  const [addressSaved, setAddressSaved] = useState(false);

  if (!user) return null;

  const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const roleLabels: Record<string, string> = {
    customer: "Customer",
    sales_manager: "Sales Manager",
    product_manager: "Product Manager",
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      {/* Header */}
      <div className="flex items-center gap-5 mb-12">
        <div className="w-16 h-16 rounded-full bg-brand-900 text-brand-50 flex items-center justify-center font-display text-xl font-semibold flex-shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-brand-900">{user.name}</h1>
          <p className="text-sm text-brand-500 mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Details */}
      <section className="mb-10">
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3 font-body">Account Details</h2>
        <div className="border border-brand-200 divide-y divide-brand-100">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Account Type" value={roleLabels[user.role] || user.role} />
          <Row label="Member Since" value={new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
        </div>
      </section>

      {/* Address */}
      <section className="mb-10">
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3 font-body">Delivery Address</h2>
        <form onSubmit={handleSaveAddress} className="border border-brand-200 p-6 space-y-4">
          <div>
            <label className="input-label">Street Address</label>
            <input type="text" value={address.street} onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))} placeholder="123 Example Street" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">City</label>
              <input type="text" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} placeholder="Istanbul" className="input-field" />
            </div>
            <div>
              <label className="input-label">Postal Code</label>
              <input type="text" value={address.zip} onChange={(e) => setAddress((p) => ({ ...p, zip: e.target.value }))} placeholder="34000" className="input-field" />
            </div>
          </div>
          <button type="submit" className="btn-primary">{addressSaved ? "Saved" : "Save Address"}</button>
          <p className="text-xs text-brand-400">Address persistence will be available in a future update.</p>
        </form>
      </section>

      {/* Order History placeholder */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3 font-body">Order History</h2>
        <div className="border border-brand-200 p-10 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm text-brand-600 mb-1">No orders yet</p>
          <p className="text-xs text-brand-400">Your completed orders will appear here once you place your first purchase.</p>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-5 py-3.5">
      <span className="text-xs tracking-wider uppercase text-brand-500 font-medium">{label}</span>
      <span className="text-sm text-brand-900">{value}</span>
    </div>
  );
}
