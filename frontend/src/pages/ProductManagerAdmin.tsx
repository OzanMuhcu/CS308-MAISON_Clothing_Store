import { useState, useEffect } from "react";
import api from "../services/api";

type Tab = "products" | "categories" | "orders" | "comments";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  category: string;
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

  useEffect(() => {
    if (tab === "products" || tab === "categories") {
      setLoading(true);
      api
        .get("/products")
        .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [tab]);

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
          </div>
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
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-brand-100 hover:bg-brand-50 transition-colors"
                    >
                      <td className="py-3 font-mono text-xs text-brand-500">{p.sku}</td>
                      <td className="py-3 font-medium text-brand-900">{p.name}</td>
                      <td className="py-3 text-brand-600">{p.category}</td>
                      <td className="py-3 text-right text-brand-900">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td
                        className={`py-3 text-right ${
                          p.stockQty === 0 ? "text-red-500" : "text-brand-900"
                        }`}
                      >
                        {p.stockQty}
                      </td>
                    </tr>
                  ))}
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

      {/* Orders — stub for future sprint */}
      {tab === "orders" && (
        <div className="py-20 text-center">
          <p className="text-brand-400 text-sm">
            Order management for product managers will be available in a future update.
          </p>
        </div>
      )}

      {/* Comments — stub for future sprint */}
      {tab === "comments" && (
        <div className="py-20 text-center">
          <p className="text-brand-400 text-sm">
            Comment moderation will be available in a future update.
          </p>
        </div>
      )}
    </div>
  );
}
