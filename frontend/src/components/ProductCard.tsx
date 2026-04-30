import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
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
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill={product.avgRating >= star ? "#d4a574" : "none"}
                  stroke={product.avgRating >= star ? "#d4a574" : "#c4b5a3"}
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-brand-400">({product.ratingCount})</span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-body text-sm font-medium text-brand-900 leading-snug truncate">{product.name}</h3>
          {outOfStock
            ? <span className="flex-shrink-0 text-[10px] tracking-wide text-red-500 font-medium">Out of stock</span>
            : lowStock
              ? <span className="flex-shrink-0 text-[10px] tracking-wide text-amber-600 font-medium">Only {product.stockQty} left</span>
              : <span className="flex-shrink-0 text-[10px] tracking-wide text-green-600 font-medium">{product.stockQty} in stock</span>
          }
        </div>
        <p className="font-body text-sm text-brand-700">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
