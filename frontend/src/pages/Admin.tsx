import { useEffect, useState } from "react";
import api from "../services/api";
import type { Product } from "../types";

type DraftValues = {
  price: string;
  discount: string;
};

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, DraftValues>>({});
  const [rowStatus, setRowStatus] = useState<Record<number, string>>({});

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
          };
        });
        setDrafts(nextDrafts);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
      const { data } = await api.patch(`/products/${product.id}`, { price, discount });
      const updated: Product = data.product;
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setDrafts((prev) => ({
        ...prev,
        [product.id]: {
          price: updated.price.toFixed(2),
          discount: (updated.discount ?? 0).toFixed(2),
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

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand-400">
          Sales Manager
        </p>
        <h1 className="font-display text-3xl font-semibold text-brand-900">Admin</h1>
      </div>

      <div className="border-b border-brand-200 mb-6">
        <button className="text-xs tracking-widest uppercase font-medium text-brand-900 border-b-2 border-brand-900 pb-3">
          Products
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 border border-brand-100">
          <p className="text-sm text-brand-500">No products available.</p>
        </div>
      ) : (
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
                  <div className="grid grid-cols-2 gap-3 w-full md:max-w-sm">
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
                      <label className="input-label">Discount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft?.discount ?? (product.discount ?? 0).toFixed(2)}
                        onChange={(e) => updateDraft(product.id, "discount", e.target.value)}
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
      )}
    </div>
  );
}
