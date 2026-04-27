import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { user } = useAuth();
  const { items, count, total, updateQty, removeItem } = useCart();
  const navigate = useNavigate();

  if (count === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-4">Your Cart</h1>
        <p className="text-sm text-brand-500 mb-6">Your cart is empty. Browse our collection to find something you like.</p>
        <Link to="/" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-10">Your Cart</h1>

      <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-brand-200 text-xs tracking-widest uppercase text-brand-400 font-medium">
        <div className="col-span-6">Product</div>
        <div className="col-span-2 text-center">Quantity</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
      </div>

      <div className="divide-y divide-brand-100">
        {items.map((item) => (
          <div key={item.productId} className="grid grid-cols-12 gap-4 py-6 items-center">
            <div className="col-span-12 md:col-span-6 flex items-center gap-4">
              <div className="w-20 h-24 bg-brand-100 flex-shrink-0 overflow-hidden">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-brand-300 text-xs">No image</div>}
              </div>
              <div>
                <Link to={`/products/${item.productId}`} className="text-sm font-medium text-brand-900 hover:underline underline-offset-2">{item.name}</Link>
                <p className="text-xs text-brand-400 mt-1">SKU: {item.sku}</p>
                <button onClick={() => removeItem(item.productId, item.itemId)} className="text-xs text-brand-400 hover:text-red-600 mt-2 transition-colors">Remove</button>
              </div>
            </div>
            <div className="col-span-4 md:col-span-2 flex items-center justify-center gap-2">
              <button onClick={() => updateQty(item.productId, Math.max(1, item.quantity - 1), item.itemId)} className="w-8 h-8 border border-brand-200 flex items-center justify-center text-brand-700 hover:bg-brand-100 transition-colors text-sm">&minus;</button>
              <span className="w-8 text-center text-sm font-medium text-brand-900">{item.quantity}</span>
              <button onClick={() => updateQty(item.productId, Math.min(item.quantity + 1, item.stockQty), item.itemId)} className="w-8 h-8 border border-brand-200 flex items-center justify-center text-brand-700 hover:bg-brand-100 transition-colors text-sm">+</button>
            </div>
            <div className="col-span-4 md:col-span-2 text-right text-sm text-brand-700">${item.price.toFixed(2)}</div>
            <div className="col-span-4 md:col-span-2 text-right text-sm font-medium text-brand-900">${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-900 mt-6 pt-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-brand-500">{count} {count === 1 ? "item" : "items"}</span>
          <span className="text-xl font-display font-semibold text-brand-900">${total.toFixed(2)}</span>
        </div>
        {!user && (
          <p className="text-xs text-brand-400 mb-4">
            You need to <Link to="/login" className="underline text-brand-700">sign in</Link> before placing an order. Your cart will be preserved.
          </p>
        )}
        <button disabled={!user} className="btn-primary w-full" onClick={() => navigate("/checkout")}>
          {user ? "Proceed to Checkout" : "Sign In to Checkout"}
        </button>
        <Link to="/" className="block text-center text-xs tracking-widest uppercase text-brand-500 hover:text-brand-900 mt-4 transition-colors">Continue Shopping</Link>
      </div>
    </div>
  );
}
