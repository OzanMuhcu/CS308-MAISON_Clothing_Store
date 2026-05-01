import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Product, WishlistItem, WishlistList } from "../types";

function DisplayRating({ value, size = "w-3 h-3" }: { value: number; size?: string }) {
  const normalized = Math.max(0, Math.min(5, value));
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, normalized - (star - 1)));
        return (
          <div key={star} className={`relative ${size} shrink-0`}>
            <svg
              className="absolute inset-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c4b5a3"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
            {fill > 0 && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg
                  className="absolute inset-0"
                  viewBox="0 0 24 24"
                  fill="#d4a574"
                  stroke="#d4a574"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [wishlists, setWishlists] = useState<WishlistList[]>([]);
  const [loadingWishlists, setLoadingWishlists] = useState(false);
  const [loadingWishlistItems, setLoadingWishlistItems] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistNotice, setWishlistNotice] = useState("");
  const outOfStock = product.stockQty <= 0;
  const lowStock = product.stockQty > 0 && product.stockQty < 5;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    try {
      await addItem({ productId: product.id, quantity: 1, name: product.name, price: product.price, imageUrl: product.imageUrl, stockQty: product.stockQty, sku: product.sku });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    } catch {} finally { setAdding(false); }
  };

  useEffect(() => {
    if (!wishlistOpen || !selectedWishlistId || !user) return;
    setLoadingWishlistItems(true);
    api
      .get(`/wishlists/${selectedWishlistId}/items`)
      .then((r) => setWishlistItems(r.data || []))
      .catch(() => setWishlistItems([]))
      .finally(() => setLoadingWishlistItems(false));
  }, [wishlistOpen, selectedWishlistId, user]);

  useEffect(() => {
    if (!selectedWishlistId) {
      setInWishlist(false);
      return;
    }
    const found = wishlistItems.some((item) => item.productId === product.id);
    setInWishlist(found);
  }, [wishlistItems, selectedWishlistId, product.id]);

  const openWishlistPicker = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistNotice("");
    if (!wishlistOpen && user && wishlists.length === 0 && !loadingWishlists) {
      setLoadingWishlists(true);
      try {
        const { data } = await api.get("/wishlists");
        const loaded: WishlistList[] = data || [];
        setWishlists(loaded);
        setSelectedWishlistId(loaded.length > 0 ? loaded[0].id : null);
      } catch {
        setWishlists([]);
        setSelectedWishlistId(null);
      } finally {
        setLoadingWishlists(false);
      }
    }
    setWishlistOpen((prev) => !prev);
  };

  const handleWishlistAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedWishlistId) return;
    setWishlistNotice("");
    try {
      if (inWishlist) {
        await api.delete(`/wishlists/${selectedWishlistId}/items/${product.id}`);
        setInWishlist(false);
        setWishlistItems((prev) => prev.filter((item) => item.productId !== product.id));
        setWishlistNotice("Removed from wishlist.");
      } else {
        await api.post(`/wishlists/${selectedWishlistId}/items`, { productId: product.id });
        setInWishlist(true);
        setWishlistItems((prev) => [
          {
            id: -1,
            wishlistId: selectedWishlistId,
            productId: product.id,
            createdAt: new Date().toISOString(),
            product,
          },
          ...prev,
        ]);
        setWishlistNotice("Added to wishlist.");
      }
      setTimeout(() => setWishlistNotice(""), 2000);
    } catch {
      setWishlistNotice("Unable to update. Try again.");
      setTimeout(() => setWishlistNotice(""), 2000);
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-100 mb-3">
        {!imageError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-400 text-xs tracking-wide uppercase">
            Image unavailable
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-brand-50/60 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase font-medium text-brand-700 bg-white/90 px-4 py-2">Sold Out</span>
          </div>
        )}
        {user && (
          <div className="absolute top-3 right-3">
            <button
              onClick={openWishlistPicker}
              className="w-9 h-9 flex items-center justify-center bg-white/90 border border-brand-200 rounded-full shadow-sm transition-all hover:shadow-md"
              title="Choose wishlist"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={inWishlist ? "#c0392b" : "none"}
                stroke={inWishlist ? "#c0392b" : "#999"}
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </button>
            {wishlistOpen && (
              <div
                className="mt-2 w-48 bg-white border border-brand-200 shadow-lg p-3 text-xs text-brand-600"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {loadingWishlists || loadingWishlistItems ? (
                  <p>Loading wishlists...</p>
                ) : wishlists.length === 0 ? (
                  <p>Create a wishlist on the Wishlist page to save items.</p>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedWishlistId ?? ""}
                      onChange={(e) => setSelectedWishlistId(Number(e.target.value))}
                      className="input-field text-xs"
                    >
                      {wishlists.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleWishlistAction}
                      disabled={!selectedWishlistId}
                      className="w-full border border-brand-300 text-brand-600 hover:bg-brand-50 py-2 text-[10px] tracking-widest uppercase font-medium disabled:opacity-50"
                    >
                      {inWishlist ? "Remove" : "Add"}
                    </button>
                    {wishlistNotice && (
                      <p className="text-[10px] text-brand-400">{wishlistNotice}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {!outOfStock && (
          <button onClick={handleAdd} disabled={adding}
            className="absolute bottom-0 left-0 right-0 bg-brand-900/90 text-brand-50 text-xs tracking-widest uppercase font-medium py-3 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 disabled:opacity-60">
            {justAdded ? "Added" : adding ? "Adding..." : "Add to Cart"}
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] tracking-widest uppercase text-brand-400">{product.category}</p>
        {product.ratingCount > 0 && (
          <div className="flex items-center gap-1">
            <DisplayRating value={product.avgRating} />
            <span className="text-[10px] text-brand-400">({product.ratingCount})</span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-body text-sm font-medium text-brand-900 leading-snug truncate">{product.name}</h3>
          {outOfStock
            ? <span className="flex-shrink-0 text-[10px] tracking-wide text-red-500 font-medium">Out of stock</span>
            : lowStock
              ? <span className="flex-shrink-0 text-[10px] tracking-wide text-amber-600 font-medium">Only {product.stockQty} left</span>
              : null
          }
        </div>
        <p className="font-body text-sm text-brand-700">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
