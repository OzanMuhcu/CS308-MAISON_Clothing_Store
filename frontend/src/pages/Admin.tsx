import { useEffect, useState } from "react";
import api from "../services/api";
import type { Order, Product, RefundRequestAdmin } from "../types";

type DraftValues = {
  price: string;
  discount: string;
  discountName: string;
  discountType: string;
  discountStartsAt: string;
  discountEndsAt: string;
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "refunds">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, DraftValues>>({});
  const [rowStatus, setRowStatus] = useState<Record<number, string>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [ordersMessage, setOrdersMessage] = useState("");
  const [refunds, setRefunds] = useState<RefundRequestAdmin[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundsMessage, setRefundsMessage] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/products")
      .then(({ data }) => {
        const loaded: Product[] = data || [];
        setProducts(loaded);
        const nextDrafts: Record<number, DraftValues> = {};
        loaded.forEach((p) => {
          nextDrafts[p.id] = {
            price: p.price.toFixed(2),
            discount: (p.discount ?? 0).toFixed(2),
            discountName: p.discountName ?? "",
            discountType: p.discountType ?? "",
            discountStartsAt: toInputDateTime(p.discountStartsAt),
            discountEndsAt: toInputDateTime(p.discountEndsAt),
          };
        });
        setDrafts(nextDrafts);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "orders") return;
    setOrdersLoading(true);
    setOrdersMessage("");
    api
      .get("/orders/admin", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      })
      .then(({ data }) => setOrders(data || []))
      .catch((err) => {
        setOrders([]);
        setOrdersMessage(err.response?.data?.error || "Unable to load orders.");
      })
      .finally(() => setOrdersLoading(false));
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    if (activeTab !== "refunds") return;
    setRefundsLoading(true);
    setRefundsMessage("");
    api
      .get("/orders/admin/refunds")
      .then(({ data }) => setRefunds(data || []))
      .catch((err) => {
        setRefunds([]);
        setRefundsMessage(err.response?.data?.error || "Unable to load refund requests.");
      })
      .finally(() => setRefundsLoading(false));
  }, [activeTab]);

  const updateDraft = (id: number, field: keyof DraftValues, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (product: Product) => {
    const draft = drafts[product.id];
    if (!draft) return;
    const price = Number(draft.price);
    const discount = Number(draft.discount);
    if (Number.isNaN(price) || price < 0) {
      setRowStatus((prev) => ({ ...prev, [product.id]: "Price must be a non-negative number." }));
      return;
    }
    if (Number.isNaN(discount) || discount < 0) {
      setRowStatus((prev) => ({ ...prev, [product.id]: "Discount must be a non-negative number." }));
      return;
    }
    setSavingId(product.id);
    try {
      const { data } = await api.patch(`/products/${product.id}`, {
        price,
        discount,
        discountName: draft.discountName.trim() || null,
        discountType: draft.discountType.trim() || null,
        discountStartsAt: draft.discountStartsAt
          ? new Date(draft.discountStartsAt).toISOString()
          : null,
        discountEndsAt: draft.discountEndsAt
          ? new Date(draft.discountEndsAt).toISOString()
          : null,
      });
      const updated: Product = data.product;
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setDrafts((prev) => ({
        ...prev,
        [product.id]: {
          price: updated.price.toFixed(2),
          discount: (updated.discount ?? 0).toFixed(2),
          discountName: updated.discountName ?? "",
          discountType: updated.discountType ?? "",
          discountStartsAt: toInputDateTime(updated.discountStartsAt),
          discountEndsAt: toInputDateTime(updated.discountEndsAt),
        },
      }));
      setRowStatus((prev) => ({ ...prev, [product.id]: "Saved." }));
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [product.id]: "" }));
      }, 2000);
    } catch (err: any) {
      setRowStatus((prev) => ({
        ...prev,
        [product.id]: err.response?.data?.error || "Unable to save. Try again.",
      }));
    } finally {
      setSavingId(null);
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    setDownloadingId(order.id);
    setOrdersMessage("");
    try {
      const response = await api.get(`/orders/admin/${order.id}/invoice`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${order.invoiceNo || `order-${order.id}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setOrdersMessage(err.response?.data?.error || "Unable to download invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReviewRefund = async (requestId: number, status: "approved" | "rejected") => {
    setReviewingId(requestId);
    setRefundsMessage("");
    try {
      const { data } = await api.patch(`/orders/admin/refunds/${requestId}`, { status });
      if (data?.request) {
        setRefunds((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: data.request.status, resolvedAt: data.request.resolvedAt } : r)));
      }
    } catch (err: any) {
      setRefundsMessage(err.response?.data?.error || "Unable to update refund request.");
    } finally {
      setReviewingId(null);
    }
  };

  const revenueByDate = orders.reduce<Record<string, number>>((acc, order) => {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + order.totalAmount;
    return acc;
  }, {});

  const revenueSeries = Object.entries(revenueByDate)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));

  const maxRevenue = revenueSeries.reduce((max, item) => Math.max(max, item.revenue), 0) || 1;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand-400">
          Sales Manager
        </p>
        <h1 className="font-display text-3xl font-semibold text-brand-900">Admin</h1>
      </div>

      <div className="border-b border-brand-200 mb-6 flex gap-6">
        <button
          className={`text-xs tracking-widest uppercase font-medium pb-3 ${
            activeTab === "products"
              ? "text-brand-900 border-b-2 border-brand-900"
              : "text-brand-400"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`text-xs tracking-widest uppercase font-medium pb-3 ${
            activeTab === "orders"
              ? "text-brand-900 border-b-2 border-brand-900"
              : "text-brand-400"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          className={`text-xs tracking-widest uppercase font-medium pb-3 ${
            activeTab === "refunds"
              ? "text-brand-900 border-b-2 border-brand-900"
              : "text-brand-400"
          }`}
          onClick={() => setActiveTab("refunds")}
        >
          Refunds
        </button>
      </div>

      {activeTab === "products" && loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "products" && products.length === 0 ? (
        <div className="text-center py-16 border border-brand-100">
          <p className="text-sm text-brand-500">No products available.</p>
        </div>
      ) : activeTab === "products" ? (
        <div className="space-y-4">
          {products.map((product) => {
            const draft = drafts[product.id];
            return (
              <div key={product.id} className="border border-brand-200 bg-white p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase text-brand-400">{product.category}</p>
                    <h2 className="font-display text-lg text-brand-900">{product.name}</h2>
                    <p className="text-xs text-brand-500">SKU: {product.sku}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full md:max-w-md">
                    <div>
                      <label className="input-label">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft?.price ?? product.price.toFixed(2)}
                        onChange={(e) => updateDraft(product.id, "price", e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">Discount (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft?.discount ?? (product.discount ?? 0).toFixed(2)}
                        onChange={(e) => updateDraft(product.id, "discount", e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">Campaign Name</label>
                      <input
                        type="text"
                        value={draft?.discountName ?? ""}
                        onChange={(e) => updateDraft(product.id, "discountName", e.target.value)}
                        className="input-field"
                        placeholder="Spring Edit"
                      />
                    </div>
                    <div>
                      <label className="input-label">Campaign Type</label>
                      <input
                        type="text"
                        value={draft?.discountType ?? ""}
                        onChange={(e) => updateDraft(product.id, "discountType", e.target.value)}
                        className="input-field"
                        placeholder="Seasonal"
                      />
                    </div>
                    <div>
                      <label className="input-label">Start</label>
                      <input
                        type="datetime-local"
                        value={draft?.discountStartsAt ?? ""}
                        onChange={(e) => updateDraft(product.id, "discountStartsAt", e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">End</label>
                      <input
                        type="datetime-local"
                        value={draft?.discountEndsAt ?? ""}
                        onChange={(e) => updateDraft(product.id, "discountEndsAt", e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(product)}
                      disabled={savingId === product.id}
                      className="btn-primary"
                    >
                      {savingId === product.id ? "Saving..." : "Save"}
                    </button>
                    {rowStatus[product.id] && (
                      <span className="text-xs text-brand-500">{rowStatus[product.id]}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === "orders" ? (
        ordersLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border border-brand-200 bg-white p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="input-label">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="border border-brand-300 text-brand-600 hover:bg-brand-50 px-4 py-2 text-xs tracking-widest uppercase font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              {ordersMessage && (
                <p className="mt-3 text-xs text-red-600">{ordersMessage}</p>
              )}
            </div>

            <div className="border border-brand-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm tracking-widest uppercase text-brand-600">Revenue</h3>
                <p className="text-xs text-brand-500">{revenueSeries.length} {revenueSeries.length === 1 ? "day" : "days"}</p>
              </div>
              {revenueSeries.length === 0 ? (
                <p className="text-sm text-brand-500">No revenue data for the selected range.</p>
              ) : (
                <div className="flex items-end gap-3 h-36">
                  {revenueSeries.map((item) => (
                    <div key={item.date} className="flex-1 min-w-[28px] flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-brand-900/80 rounded-t"
                        style={{ height: `${Math.max(8, (item.revenue / maxRevenue) * 120)}px` }}
                        title={`$${item.revenue.toFixed(2)} on ${item.date}`}
                      />
                      <span className="text-[10px] text-brand-500">
                        {new Date(item.date + "T00:00:00.000Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 border border-brand-100">
                <p className="text-sm text-brand-500">No orders available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-brand-200 bg-white p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-widest uppercase text-brand-400">Order</p>
                        <h2 className="text-lg text-brand-900 font-semibold">{order.invoiceNo || `Order #${order.id}`}</h2>
                        <p className="text-xs text-brand-500">{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-900">${order.totalAmount.toFixed(2)}</p>
                        <span className="inline-block mt-1 text-[10px] tracking-wider uppercase px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200">
                          {order.status}
                        </span>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={downloadingId === order.id}
                            className="border border-brand-300 text-brand-600 hover:bg-brand-50 px-3 py-1.5 text-[10px] tracking-widest uppercase font-medium disabled:opacity-60"
                          >
                            {downloadingId === order.id ? "Downloading..." : "Download Invoice"}
                          </button>
                        </div>
                      </div>
                    </div>
                    {order.user && (
                      <div className="mt-3 text-sm text-brand-600">
                        <span className="font-medium text-brand-800">Customer:</span> {order.user.name} ({order.user.email})
                      </div>
                    )}
                    <div className="mt-3 text-xs text-brand-500">
                      {order.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : activeTab === "refunds" ? (
        refundsLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-16 border border-brand-100">
            <p className="text-sm text-brand-500">No refund requests available.</p>
            {refundsMessage && <p className="text-xs text-red-600 mt-2">{refundsMessage}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {refundsMessage && (
              <div className="px-4 py-3 bg-brand-100 border border-brand-200 text-sm text-brand-700 rounded">
                {refundsMessage}
              </div>
            )}
            {refunds.map((request) => (
              <div key={request.id} className="border border-brand-200 bg-white p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase text-brand-400">Refund Request</p>
                    <h2 className="text-lg text-brand-900 font-semibold">
                      {request.order.invoiceNo || `Order #${request.order.id}`}
                    </h2>
                    <p className="text-xs text-brand-500">
                      Requested {new Date(request.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand-900">${request.order.totalAmount.toFixed(2)}</p>
                    <span className={`inline-block mt-1 text-[10px] tracking-wider uppercase px-2 py-0.5 border ${
                      request.status === "approved"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : request.status === "rejected"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-sm text-brand-600">
                  <span className="font-medium text-brand-800">Customer:</span> {request.user.name} ({request.user.email})
                </div>
                <div className="mt-3 text-xs text-brand-500">
                  {request.order.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}
                </div>
                {request.status === "pending" && (
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleReviewRefund(request.id, "approved")}
                      disabled={reviewingId === request.id}
                      className="btn-primary text-xs px-4 py-2 disabled:opacity-60"
                    >
                      {reviewingId === request.id ? "Saving..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewRefund(request.id, "rejected")}
                      disabled={reviewingId === request.id}
                      className="border border-brand-300 text-brand-600 hover:bg-brand-50 px-4 py-2 text-xs tracking-widest uppercase font-medium disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {request.status !== "pending" && request.resolvedAt && (
                  <p className="mt-3 text-xs text-brand-400">
                    Resolved {new Date(request.resolvedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
