import React, { useState, useEffect } from "react";
import api from "../services/api";

type Tab = "products" | "categories" | "orders" | "comments";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  category: string;
  serialNumber?: string;
  description?: string;
  imageUrl?: string;
  model?: string;
  warrantyStatus?: string;
  distributorInfo?: string;
  isActive?: boolean;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  sku: "",
  serialNumber: "",
  category: "",
  model: "",
  stockQty: "0",
  imageUrl: "",
  warrantyStatus: "None",
  distributorInfo: "",
};

interface PendingComment {
  id: number;
  text: string;
  status: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
  product: { id: number; name: string };
}

const TABS: { key: Tab; label: string }[] = [
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "orders", label: "Orders" },
  { key: "comments", label: "Comments" },
];

export default function ProductManagerAdmin() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [moderating, setModerating] = useState<number | null>(null);

  // Orders state
  const [pmOrders, setPmOrders] = useState<any[]>([]);
  const [pmOrdersLoading, setPmOrdersLoading] = useState(false);
  const [pmStatusUpdating, setPmStatusUpdating] = useState<number | null>(null);
  const [pmOrdersError, setPmOrdersError] = useState("");

  // Product creation form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Product edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string; description: string; category: string; model: string;
    stockQty: string; imageUrl: string; warrantyStatus: string; distributorInfo: string;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    if (tab === "products" || tab === "categories") {
      setLoading(true);
      api
        .get("/products/manager")
        .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
    if (tab === "comments") {
      setCommentsLoading(true);
      api
        .get("/reviews/pending")
        .then(({ data }) => setComments(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setCommentsLoading(false));
    }
    if (tab === "orders") {
      setPmOrdersLoading(true);
      setPmOrdersError("");
      api
        .get("/orders/manager")
        .then(({ data }) => setPmOrders(Array.isArray(data) ? data : []))
        .catch((err) => setPmOrdersError(err.response?.data?.error || "Failed to load orders."))
        .finally(() => setPmOrdersLoading(false));
    }
  }, [tab]);

  async function moderateComment(id: number, status: "approved" | "rejected") {
    setModerating(id);
    try {
      await api.patch(`/reviews/comment/${id}/status`, { status });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setModerating(null);
    }
  }

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.sku.trim()) { setFormError("SKU is required."); return; }
    if (!form.serialNumber.trim()) { setFormError("Serial number is required."); return; }

    setFormLoading(true);
    try {
      const { data } = await api.post("/products", {
        name: form.name.trim(),
        description: form.description.trim(),
        price: 0,
        stockQty: parseInt(form.stockQty, 10) || 0,
        sku: form.sku.trim(),
        imageUrl: form.imageUrl.trim(),
        category: form.category.trim(),
        model: form.model.trim(),
        serialNumber: form.serialNumber.trim(),
        warrantyStatus: form.warrantyStatus.trim() || "None",
        distributorInfo: form.distributorInfo.trim(),
      });
      setProducts((prev) => [data.product, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create product.");
    } finally {
      setFormLoading(false);
    }
  }

  function startEdit(p: Product) {
    if (editingId === p.id) {
      setEditingId(null);
      setEditDraft(null);
      setEditError("");
      return;
    }
    setEditingId(p.id);
    setEditDraft({
      name: p.name,
      description: p.description ?? "",
      category: p.category ?? "",
      model: p.model ?? "",
      stockQty: String(p.stockQty),
      imageUrl: p.imageUrl ?? "",
      warrantyStatus: p.warrantyStatus ?? "None",
      distributorInfo: p.distributorInfo ?? "",
    });
    setEditError("");
  }

  function setEditField(field: string, value: string) {
    setEditDraft((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSaveEdit(productId: number) {
    if (!editDraft) return;
    setEditSaving(true);
    setEditError("");
    try {
      const { data } = await api.patch(`/products/manager/${productId}`, {
        name: editDraft.name.trim(),
        description: editDraft.description.trim(),
        stockQty: parseInt(editDraft.stockQty, 10) || 0,
        imageUrl: editDraft.imageUrl.trim(),
        category: editDraft.category.trim(),
        model: editDraft.model.trim(),
        warrantyStatus: editDraft.warrantyStatus.trim() || "None",
        distributorInfo: editDraft.distributorInfo.trim(),
      });
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, ...data.product } : p));
      setEditingId(null);
      setEditDraft(null);
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleToggleActive(p: Product) {
    setToggling(p.id);
    try {
      const { data } = await api.patch(`/products/manager/${p.id}`, { isActive: !p.isActive });
      setProducts((prev) => prev.map((prod) => prod.id === p.id ? { ...prod, ...data.product } : prod));
    } catch (err: any) {
      console.error(err.response?.data?.error || "Failed to update visibility.");
    } finally {
      setToggling(null);
    }
  }

  async function handleUpdateOrderStatus(orderId: number, status: "in_transit" | "delivered") {
    setPmStatusUpdating(orderId);
    try {
      const { data } = await api.patch(`/orders/manager/${orderId}/status`, { status });
      setPmOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, ...data.order } : o));
    } catch (err: any) {
      setPmOrdersError(err.response?.data?.error || "Failed to update status.");
    } finally {
      setPmStatusUpdating(null);
    }
  }

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-8">
        Product Manager
      </h1>

      {/* Tab bar */}
      <div className="flex gap-6 border-b border-brand-200 mb-8">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-brand-400 hover:text-brand-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Products */}
      {tab === "products" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-brand-900">All Products</h2>
            <button
              onClick={() => { setShowForm((v) => !v); setFormError(""); }}
              className="px-4 py-2 text-xs font-medium tracking-wide bg-brand-900 text-white hover:bg-brand-700 transition-colors"
            >
              {showForm ? "Cancel" : "+ Add Product"}
            </button>
          </div>

          {/* Add Product Form */}
          {showForm && (
            <form
              onSubmit={handleCreateProduct}
              className="border border-brand-200 bg-white p-6 mb-8 space-y-5"
            >
              <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide">New Product</h3>

              {/* Row 1: Name + SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className="input-field"
                    placeholder="Classic Oxford Shirt"
                  />
                </div>
                <div>
                  <label className="input-label">SKU *</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setField("sku", e.target.value)}
                    className="input-field"
                    placeholder="MSN-SHT-001"
                  />
                </div>
              </div>

              {/* Row 2: Serial Number + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Serial Number *</label>
                  <input
                    type="text"
                    value={form.serialNumber}
                    onChange={(e) => setField("serialNumber", e.target.value)}
                    className="input-field"
                    placeholder="SN-2026-00001"
                  />
                </div>
                <div>
                  <label className="input-label">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className="input-field"
                    placeholder="Shirts"
                  />
                </div>
              </div>

              {/* Row 3: Model + Stock Qty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Model</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setField("model", e.target.value)}
                    className="input-field"
                    placeholder="Slim Fit"
                  />
                </div>
                <div>
                  <label className="input-label">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQty}
                    onChange={(e) => setField("stockQty", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Row 4: Warranty + Distributor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Warranty Status</label>
                  <input
                    type="text"
                    value={form.warrantyStatus}
                    onChange={(e) => setField("warrantyStatus", e.target.value)}
                    className="input-field"
                    placeholder="1 Year"
                  />
                </div>
                <div>
                  <label className="input-label">Distributor Info</label>
                  <input
                    type="text"
                    value={form.distributorInfo}
                    onChange={(e) => setField("distributorInfo", e.target.value)}
                    className="input-field"
                    placeholder="MAISON Distribution Ltd."
                  />
                </div>
              </div>

              {/* Image URL with preview */}
              <div>
                <label className="input-label">Image URL</label>
                <div className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setField("imageUrl", e.target.value)}
                    className="input-field flex-1"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {form.imageUrl.trim() && (
                    <img
                      src={form.imageUrl.trim()}
                      alt="preview"
                      className="w-16 h-20 object-cover border border-brand-200 shrink-0"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="input-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className="input-field w-full h-24 resize-none"
                  placeholder="Product description..."
                  maxLength={5000}
                />
              </div>

              <p className="text-xs text-brand-400">
                Price is set to $0 (hidden from storefront) until a Sales Manager assigns a price.
              </p>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 text-xs font-medium tracking-wide bg-brand-900 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-200">
                    <th className="text-left py-3 text-brand-500 font-medium">SKU</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Name</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Category</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Price</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Stock</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Visibility</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.flatMap((p) => {
                    const unpriced = Number(p.price) === 0;
                    const inactive = p.isActive === false;
                    const isEditing = editingId === p.id;
                    const rowBg = inactive
                      ? "bg-red-50 hover:bg-red-100"
                      : unpriced
                      ? "bg-amber-50 hover:bg-amber-100"
                      : "hover:bg-brand-50";
                    return [
                      <tr key={p.id} className={`border-b border-brand-100 transition-colors ${rowBg}`}>
                        <td className="py-3 font-mono text-xs text-brand-500">{p.sku}</td>
                        <td className={`py-3 font-medium ${inactive ? "text-brand-400 line-through" : "text-brand-900"}`}>{p.name}</td>
                        <td className="py-3 text-brand-600">{p.category}</td>
                        <td className="py-3 text-right text-brand-900">
                          {unpriced ? (
                            <span className="text-amber-600 font-medium">No price</span>
                          ) : (
                            `$${Number(p.price).toFixed(2)}`
                          )}
                        </td>
                        <td className={`py-3 text-right ${p.stockQty === 0 ? "text-red-500" : "text-brand-900"}`}>
                          {p.stockQty}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 ${
                            inactive
                              ? "bg-red-100 text-red-700"
                              : unpriced
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {inactive ? "Removed" : unpriced ? "Hidden" : "Visible"}
                          </span>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleToggleActive(p)}
                              disabled={toggling === p.id}
                              className={`text-xs font-medium px-3 py-1 border transition-colors disabled:opacity-50 ${
                                inactive
                                  ? "border-green-400 text-green-700 hover:bg-green-50"
                                  : "border-red-300 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {toggling === p.id ? "..." : inactive ? "Restore" : "Remove"}
                            </button>
                            <button
                              onClick={() => startEdit(p)}
                              className="text-xs font-medium px-3 py-1 border border-brand-300 text-brand-600 hover:bg-brand-50 transition-colors"
                            >
                              {isEditing ? "Cancel" : "Edit"}
                            </button>
                          </div>
                        </td>
                      </tr>,
                      ...(isEditing && editDraft ? [
                        <tr key={`edit-${p.id}`} className="bg-brand-50 border-b border-brand-200">
                          <td colSpan={7} className="px-4 py-5">
                            <div className="space-y-4">
                              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                                Editing: {p.name}
                              </p>

                              {/* Row 1: Name, Category, Model */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="input-label">Name</label>
                                  <input type="text" value={editDraft.name} onChange={(e) => setEditField("name", e.target.value)} className="input-field" />
                                </div>
                                <div>
                                  <label className="input-label">Category</label>
                                  <input type="text" value={editDraft.category} onChange={(e) => setEditField("category", e.target.value)} className="input-field" />
                                </div>
                                <div>
                                  <label className="input-label">Model</label>
                                  <input type="text" value={editDraft.model} onChange={(e) => setEditField("model", e.target.value)} className="input-field" />
                                </div>
                              </div>

                              {/* Row 2: Stock Qty, Warranty, Distributor */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="input-label">Stock Qty</label>
                                  <input type="number" min="0" value={editDraft.stockQty} onChange={(e) => setEditField("stockQty", e.target.value)} className="input-field" />
                                </div>
                                <div>
                                  <label className="input-label">Warranty Status</label>
                                  <input type="text" value={editDraft.warrantyStatus} onChange={(e) => setEditField("warrantyStatus", e.target.value)} className="input-field" />
                                </div>
                                <div>
                                  <label className="input-label">Distributor Info</label>
                                  <input type="text" value={editDraft.distributorInfo} onChange={(e) => setEditField("distributorInfo", e.target.value)} className="input-field" />
                                </div>
                              </div>

                              {/* Row 3: Image URL with preview */}
                              <div>
                                <label className="input-label">Image URL</label>
                                <div className="flex gap-3 items-start">
                                  <input type="text" value={editDraft.imageUrl} onChange={(e) => setEditField("imageUrl", e.target.value)} className="input-field flex-1" placeholder="https://..." />
                                  {editDraft.imageUrl.trim() && (
                                    <img
                                      src={editDraft.imageUrl.trim()}
                                      alt="preview"
                                      className="w-12 h-16 object-cover border border-brand-200 shrink-0"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Row 4: Description */}
                              <div>
                                <label className="input-label">Description</label>
                                <textarea value={editDraft.description} onChange={(e) => setEditField("description", e.target.value)} className="input-field w-full h-20 resize-none" maxLength={5000} />
                              </div>

                              {editError && <p className="text-sm text-red-600">{editError}</p>}

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(p.id)}
                                  disabled={editSaving}
                                  className="px-5 py-2 text-xs font-medium tracking-wide bg-brand-900 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                                >
                                  {editSaving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingId(null); setEditDraft(null); setEditError(""); }}
                                  className="px-5 py-2 text-xs font-medium border border-brand-300 text-brand-600 hover:bg-brand-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ] : []),
                    ];
                  })}
                </tbody>
              </table>
              {products.length === 0 && (
                <p className="text-center text-brand-400 py-12 text-sm">No products found.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Categories */}
      {tab === "categories" && (
        <>
          <h2 className="text-xl font-semibold text-brand-900 mb-6">Categories</h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <div key={cat} className="border border-brand-200 p-5 bg-white">
                    <p className="font-medium text-brand-900">{cat}</p>
                    <p className="text-sm text-brand-400 mt-1">
                      {count} product{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="text-brand-400 col-span-full py-12 text-center text-sm">
                  No categories found.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Orders */}
      {tab === "orders" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-brand-900">All Orders</h2>
            {pmOrders.length > 0 && (
              <span className="text-sm text-brand-500">{pmOrders.length} orders</span>
            )}
          </div>
          {pmOrdersError && (
            <p className="mb-4 text-sm text-red-600">{pmOrdersError}</p>
          )}
          {pmOrdersLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pmOrders.length === 0 ? (
            <p className="text-center text-brand-400 py-12 text-sm">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-200">
                    <th className="text-left py-3 text-brand-500 font-medium">Invoice</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Customer</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Items</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Total</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Date</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Status</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pmOrders.map((o) => {
                    const statusColors: Record<string, string> = {
                      processing: "bg-amber-100 text-amber-700",
                      in_transit: "bg-blue-100 text-blue-700",
                      delivered: "bg-green-100 text-green-700",
                      cancelled: "bg-red-100 text-red-700",
                      refunded: "bg-brand-100 text-brand-500",
                    };
                    const nextStatus = o.status === "processing" ? "in_transit" : o.status === "in_transit" ? "delivered" : null;
                    const nextLabel = o.status === "processing" ? "Mark In Transit" : o.status === "in_transit" ? "Mark Delivered" : null;
                    return (
                      <tr key={o.id} className="border-b border-brand-100 hover:bg-brand-50 transition-colors">
                        <td className="py-3 font-mono text-xs text-brand-500 whitespace-nowrap">
                          {o.invoiceNo || `#${o.id}`}
                        </td>
                        <td className="py-3 text-brand-700 whitespace-nowrap">
                          <div className="font-medium text-brand-900">{o.user?.name ?? "—"}</div>
                          <div className="text-xs text-brand-400">{o.user?.email ?? ""}</div>
                        </td>
                        <td className="py-3 text-brand-600 max-w-xs">
                          <p className="line-clamp-2 text-xs">
                            {o.items.map((i: any) => `${i.productName} ×${i.quantity}`).join(", ")}
                          </p>
                        </td>
                        <td className="py-3 text-right text-brand-900 whitespace-nowrap font-medium">
                          ${Number(o.totalAmount).toFixed(2)}
                        </td>
                        <td className="py-3 text-brand-400 text-xs whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 ${statusColors[o.status] ?? "bg-brand-100 text-brand-500"}`}>
                            {o.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          {nextStatus && nextLabel ? (
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, nextStatus as "in_transit" | "delivered")}
                              disabled={pmStatusUpdating === o.id}
                              className="text-xs font-medium px-3 py-1 bg-brand-900 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                            >
                              {pmStatusUpdating === o.id ? "Saving..." : nextLabel}
                            </button>
                          ) : (
                            <span className="text-xs text-brand-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Comments */}
      {tab === "comments" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-brand-900">Pending Comments</h2>
            {comments.length > 0 && (
              <span className="text-sm text-brand-500">{comments.length} awaiting review</span>
            )}
          </div>
          {commentsLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-brand-400 py-12 text-sm">No pending comments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-200">
                    <th className="text-left py-3 text-brand-500 font-medium">Product</th>
                    <th className="text-left py-3 text-brand-500 font-medium">User</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Comment</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Date</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((c) => (
                    <tr key={c.id} className="border-b border-brand-100 hover:bg-brand-50 transition-colors">
                      <td className="py-3 font-medium text-brand-900 whitespace-nowrap">{c.product.name}</td>
                      <td className="py-3 text-brand-600 whitespace-nowrap">
                        <div>{c.user.name}</div>
                        <div className="text-xs text-brand-400">{c.user.email}</div>
                      </td>
                      <td className="py-3 text-brand-700 max-w-xs">
                        <p className="line-clamp-3 whitespace-pre-wrap break-words">{c.text}</p>
                      </td>
                      <td className="py-3 text-brand-400 whitespace-nowrap text-xs">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => moderateComment(c.id, "approved")}
                            disabled={moderating === c.id}
                            className="px-3 py-1 text-xs font-medium bg-brand-900 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => moderateComment(c.id, "rejected")}
                            disabled={moderating === c.id}
                            className="px-3 py-1 text-xs font-medium border border-brand-300 text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
