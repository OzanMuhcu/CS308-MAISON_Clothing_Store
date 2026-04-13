import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const outOfStock = product.stockQty <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stockQty: product.stockQty,
        sku: product.sku,
      });
    } catch {
      // Silently fail in card — user can retry
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-100 mb-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {outOfStock && (
          <div className="absolute inset-0 bg-brand-50/70 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase font-medium text-brand-700 bg-white px-4 py-2">
              Sold Out
            </span>
          </div>
        )}

        {!outOfStock && (
          <button
            onClick={handleAdd}
            className="absolute bottom-0 left-0 right-0 bg-brand-900/90 text-brand-50 text-xs
                       tracking-widest uppercase font-medium py-3 text-center
                       translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            Add to Cart
          </button>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-[11px] tracking-widest uppercase text-brand-400">
          {product.category}
        </p>
        <h3 className="font-body text-sm font-medium text-brand-900 leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center gap-3">
          <p className="font-body text-sm text-brand-700">
            ${product.price.toFixed(2)}
          </p>
          {product.stockQty > 0 && product.stockQty <= 5 && (
            <span className="text-[10px] tracking-wider uppercase text-amber-700">
              Only {product.stockQty} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
