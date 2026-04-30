import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type { WishlistItem } from "../types";

export default function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    api
      .get("/wishlist")
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-8">
        My Wishlist
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-brand-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-brand-500 text-sm mb-4">Your wishlist is empty.</p>
          <Link to="/" className="text-brand-900 underline underline-offset-2 text-sm">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-white border border-brand-100 transition-shadow hover:shadow-md">
              <Link to={`/products/${item.product.id}`} className="block">
                <div className="aspect-[3/4] overflow-hidden bg-brand-100">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-400 text-xs tracking-wide uppercase">
                      Image unavailable
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-[10px] tracking-widest uppercase text-brand-400">
                    {item.product.category}
                  </p>
                  <h3 className="font-body text-sm font-medium text-brand-900 leading-snug truncate">
                    {item.product.name}
                  </h3>
                  <p className="font-body text-sm text-brand-700">
                    ${item.product.price.toFixed(2)}
                  </p>
                  {item.product.stockQty <= 0 && (
                    <span className="text-[10px] tracking-wide text-red-500 font-medium">
                      Out of stock
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={() => handleRemove(item.productId)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 border border-brand-200 text-brand-500 hover:text-red-500 hover:border-red-300 rounded-full transition-colors"
                title="Remove from wishlist"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
