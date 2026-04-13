import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface Props {
  product: Product;
}

function StockLabel({ qty }: { qty: number }) {
  if (qty <= 0)
    return <span className="text-[10px] tracking-wide text-red-500 font-medium">Out of stock</span>;
  if (qty <= 5)
    return <span className="text-[10px] tracking-wide text-amber-600">Only {qty} left</span>;
  return <span className="text-[10px] tracking-wide text-brand-400">In stock ({qty})</span>;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = product.stockQty <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    try {
      await addItem({
        productId: product.id, quantity: 1, name: product.name,
        price: product.price, imageUrl: product.imageUrl,
        stockQty: product.stockQty, sku: product.sku,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch { /* silently */ } finally { setAdding(false); }
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-100 mb-3">
        <img
          src={product.imageUrl} alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-brand-50/60 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase font-medium text-brand-700 bg-white/90 px-4 py-2">
              Sold Out
            </span>
          </div>
        )}
        {!outOfStock && (
          <button
            onClick={handleAdd} disabled={adding}
            className="absolute bottom-0 left-0 right-0 bg-brand-900/90 text-brand-50 text-xs
                       tracking-widest uppercase font-medium py-3 text-center
                       translate-y-full group-hover:translate-y-0 transition-transform duration-300
                       disabled:opacity-60"
          >
            {justAdded ? "Added" : adding ? "Adding..." : "Add to Cart"}
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-[10px] tracking-widest uppercase text-brand-400">
          {product.category}
        </p>
        {/* Product name + stock count on the same visual line group */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-body text-sm font-medium text-brand-900 leading-snug truncate">
            {product.name}
          </h3>
          <StockLabel qty={product.stockQty} />
        </div>
        <p className="font-body text-sm text-brand-700">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
