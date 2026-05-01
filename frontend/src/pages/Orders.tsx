import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type { Order } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const labelStatus = (status: string) => {
    if (status === "in_transit") return "In transit";
    return status;
  };

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="font-display text-2xl lg:text-3xl font-semibold text-brand-900 mb-8">Order History</h1>

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
                  <span className="inline-block mt-1 text-[10px] tracking-wider uppercase px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">
                    {labelStatus(order.status)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-brand-500 mb-3">
                {order.items.map((it) => `${it.productName} x${it.quantity}`).join(", ")}
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
