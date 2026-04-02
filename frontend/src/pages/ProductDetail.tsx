import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!product || product.stockQty <= 0) return;
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
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      /* handled by cart context */
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-brand-500 mb-4">Product not found.</p>
        <Link to="/" className="text-brand-900 underline underline-offset-2 text-sm">
          Back to shop
        </Link>
      </div>
    );
  }

  const outOfStock = product.stockQty <= 0;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link to="/" className="text-xs tracking-widest uppercase text-brand-400 hover:text-brand-900 transition-colors">
          Shop
        </Link>
        <span className="text-brand-300 mx-2">/</span>
        <span className="text-xs tracking-widest uppercase text-brand-600">
          {product.category}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Image */}
        <div className="aspect-[3/4] bg-brand-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="lg:py-8">
          <p className="text-[11px] tracking-[0.2em] uppercase text-brand-400 mb-3">
            {product.category}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-brand-900 mb-4">
            {product.name}
          </h1>
          <p className="text-xl text-brand-700 mb-6">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-sm text-brand-600 leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Product details table */}
          <div className="border-t border-brand-200 mb-8">
            <div className="flex justify-between py-3 border-b border-brand-100 text-sm">
              <span className="text-brand-500">SKU</span>
              <span className="text-brand-900 font-medium">{product.sku}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-brand-100 text-sm">
              <span className="text-brand-500">Stock</span>
              <span className={`font-medium ${outOfStock ? "text-red-600" : "text-brand-900"}`}>
                {outOfStock ? "Out of Stock" : `${product.stockQty} available`}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <span className="text-brand-500">Category</span>
              <span className="text-brand-900">{product.category}</span>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            disabled={outOfStock || added}
            className="btn-primary w-full"
          >
            {outOfStock
              ? "Sold Out"
              : added
              ? "Added to Cart"
              : "Add to Cart"}
          </button>

          {!outOfStock && (
            <p className="text-xs text-brand-400 text-center mt-3">
              Unit price: ${product.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
