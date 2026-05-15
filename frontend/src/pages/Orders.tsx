import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type { Order, RefundRequest } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [message, setMessage] = useState("");

  const labelStatus = (status: string) => {
    if (status === "in_transit") return "In transit";
    if (status === "cancelled") return "Cancelled";
    if (status === "refunded") return "Refunded";
    return status;
  };

  useEffect(() => {
    setLoading(true);
    setMessage("");
    Promise.all([
      api.get("/orders"),
      api.get("/orders/refunds"),
    ])
      .then(([ordersRes, refundsRes]) => {
        setOrders(ordersRes.data || []);
        setRefunds(refundsRes.data || []);
      })
      .catch((err) => {
        setOrders([]);
        setRefunds([]);
        setMessage(err.response?.data?.error || "Unable to load orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  const refundByOrder = refunds.reduce<Record<number, RefundRequest>>((acc, req) => {
    acc[req.orderId] = req;
    return acc;
  }, {});

  const handleCancel = async (orderId: number) => {
    setMessage("");
    try {
      const { data } = await api.post(`/orders/${orderId}/cancel`);
      if (data?.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Unable to cancel order.");
    }
  };

  const handleRefundRequest = async (orderId: number) => {
    setMessage("");
    try {
      const { data } = await api.post(`/orders/${orderId}/refund-request`);
      if (data?.request) {
        setRefunds((prev) => [data.request, ...prev]);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Unable to request refund.");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="font-display text-2xl lg:text-3xl font-semibold text-brand-900 mb-8">Order History</h1>

      {message && (
        <div className="mb-6 px-4 py-3 bg-brand-100 border border-brand-200 text-sm text-brand-700 rounded">
          {message}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="border border-brand-200 p-12 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm text-brand-600 mb-1">No orders yet</p>
          <p className="text-xs text-brand-400 mb-6">Once you complete a purchase, your orders will appear here.</p>
          <Link to="/" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-brand-200 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-medium text-brand-900">{order.invoiceNo}</p>
                  <p className="text-xs text-brand-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-900">${order.totalAmount.toFixed(2)}</p>
                  <span className={`inline-block mt-1 text-[10px] tracking-wider uppercase px-2 py-0.5 border ${
                    order.status === "cancelled" || order.status === "refunded"
                      ? "bg-gray-50 text-gray-700 border-gray-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {labelStatus(order.status)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-brand-500 mb-3">
                {order.items.map((it) => `${it.productName} x${it.quantity}`).join(", ")}
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {order.status === "processing" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(order.id)}
                    className="border border-brand-300 text-brand-600 hover:bg-brand-50 px-3 py-1.5 text-[10px] tracking-widest uppercase font-medium"
                  >
                    Cancel Order
                  </button>
                )}
                {order.status === "delivered" && (() => {
                  const request = refundByOrder[order.id];
                  const createdAt = new Date(order.createdAt);
                  const cutoff = new Date();
                  cutoff.setDate(cutoff.getDate() - 30);
                  const withinWindow = createdAt >= cutoff;
                  if (!withinWindow) {
                    return (
                      <span className="text-[10px] text-brand-400 uppercase tracking-widest">Refund window closed</span>
                    );
                  }
                  if (request) {
                    return (
                      <span className={`text-[10px] uppercase tracking-widest ${
                        request.status === "approved"
                          ? "text-green-700"
                          : request.status === "rejected"
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}>
                        Refund {request.status}
                      </span>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => handleRefundRequest(order.id)}
                      className="border border-brand-300 text-brand-600 hover:bg-brand-50 px-3 py-1.5 text-[10px] tracking-widest uppercase font-medium"
                    >
                      Request Refund
                    </button>
                  );
                })()}
              </div>
              <a
                href={`${API_BASE}/orders/${order.id}/invoice`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  api.get(`/orders/${order.id}/invoice`, { responseType: "blob" }).then((r) => {
                    const url = URL.createObjectURL(r.data);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${order.invoiceNo || "invoice"}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  });
                }}
                className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900 transition-colors"
              >
                Download Invoice PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
