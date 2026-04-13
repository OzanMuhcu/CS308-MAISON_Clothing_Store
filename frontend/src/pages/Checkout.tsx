import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { user } = useAuth();
  const { items, count, total } = useCart();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  if (count === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-4">Checkout</h1>
        <p className="text-sm text-brand-500 mb-6">Your cart is empty. Add items before checking out.</p>
        <Link to="/" className="btn-primary">Browse Collection</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] tracking-widest uppercase font-medium">
        <Link to="/cart" className="text-brand-400 hover:text-brand-900 transition-colors">Cart</Link>
        <svg className="w-3 h-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        <span className="text-brand-900">Checkout</span>
        <svg className="w-3 h-3 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        <span className="text-brand-300">Payment</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-8">Order Summary</h1>

      {/* Items */}
      <div className="border border-brand-200 mb-8">
        <div className="px-5 py-3 bg-brand-100/50 border-b border-brand-200">
          <p className="text-xs tracking-wider uppercase text-brand-500 font-medium">
            {count} {count === 1 ? "Item" : "Items"}
          </p>
        </div>
        <div className="divide-y divide-brand-100">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 px-5 py-4">
              <div className="w-14 h-[72px] bg-brand-100 flex-shrink-0 overflow-hidden">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-brand-300 text-[9px]">No image</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-900 truncate">{item.name}</p>
                <p className="text-xs text-brand-400 mt-0.5">SKU: {item.sku}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-brand-900 font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-xs text-brand-400">Qty {item.quantity} &times; ${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border border-brand-200 p-5 mb-8 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-brand-500">Subtotal</span>
          <span className="text-brand-900">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-brand-500">Shipping</span>
          <span className="text-brand-400 text-xs">Calculated at next step</span>
        </div>
        <div className="border-t border-brand-200 pt-3 flex justify-between items-center">
          <span className="text-xs tracking-wider uppercase font-medium text-brand-900">Total</span>
          <span className="text-xl font-display font-semibold text-brand-900">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <button className="btn-primary w-full mb-4" onClick={() => navigate("/payment")}>
        Continue to Payment
      </button>
      <Link to="/cart" className="block text-center text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 transition-colors">
        Back to Cart
      </Link>
    </div>
  );
}
