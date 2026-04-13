import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { user } = useAuth();
  const [address, setAddress] = useState({ street: "", city: "", zip: "" });
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const initials = user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const roles: Record<string, string> = { customer: "Customer", sales_manager: "Sales Manager", product_manager: "Product Manager" };

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 rounded-full bg-brand-900 text-brand-50 flex items-center justify-center font-display text-lg font-semibold">{initials}</div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">{user.name}</h1>
          <p className="text-sm text-brand-500">{user.email}</p>
        </div>
      </div>

      {/* Details */}
      <section className="mb-10">
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">Account Details</h2>
        <div className="border border-brand-200 divide-y divide-brand-100">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Account Type" value={roles[user.role] || user.role} />
          <Row label="Member Since" value={new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
        </div>
      </section>

      {/* Delivery Address — placeholder for Story 14 */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">Delivery Address</h2>
        <form onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="border border-brand-200 p-6 space-y-4">
          <div>
            <label className="input-label">Street Address</label>
            <input type="text" value={address.street} onChange={(e) => setAddress(p => ({ ...p, street: e.target.value }))} placeholder="123 Example Street" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="input-label">City</label><input type="text" value={address.city} onChange={(e) => setAddress(p => ({ ...p, city: e.target.value }))} placeholder="Istanbul" className="input-field" /></div>
            <div><label className="input-label">Postal Code</label><input type="text" value={address.zip} onChange={(e) => setAddress(p => ({ ...p, zip: e.target.value }))} placeholder="34000" className="input-field" /></div>
          </div>
          <button type="submit" className="btn-primary">{saved ? "Saved" : "Save Address"}</button>
          <p className="text-xs text-brand-400">Address persistence will be available in a future update.</p>
        </form>
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
