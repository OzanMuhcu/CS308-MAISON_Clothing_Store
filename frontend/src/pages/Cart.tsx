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
        <h1 className="font-display text-3xl font-semibold text-brand-900 mb-4">
          Your Cart
        </h1>
        <p className="text-sm text-brand-500 mb-6">
          Your cart is empty. Browse our collection to find something you like.
        </p>
        <Link to="/" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-10">
        Your Cart
      </h1>

      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-brand-200 text-xs tracking-widest uppercase text-brand-400 font-medium">
        <div className="col-span-6">Product</div>
        <div className="col-span-2 text-center">Quantity</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
      </div>

      {/* Items */}
      <div className="divide-y divide-brand-100">
        {items.map((item) => (
          <div
            key={item.productId}
            className="grid grid-cols-12 gap-4 py-6 items-center"
          >
            {/* Product */}
            <div className="col-span-12 md:col-span-6 flex items-center gap-4">
              <div className="w-20 h-24 bg-brand-100 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-300 text-xs">
                    No image
                  </div>
                )}
              </div>

              <div>
                <Link
                  to={`/products/${item.productId}`}
                  className="text-sm font-medium text-brand-900 hover:underline"
                >
                  {item.name}
                </Link>

                <p className="text-xs text-brand-400 mt-1">
                  SKU: {item.sku}
                </p>

                <button
                  onClick={() => removeItem(item.productId, item.itemId)}
                  className="text-xs text-brand-400 hover:text-red-600 mt-2"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div className="col-span-4 md:col-span-2 flex justify-center gap-2">
              <button
                onClick={() =>
                  updateQty(
                    item.productId,
                    Math.max(1, item.quantity - 1),
                    item.itemId
                  )
                }
                className="w-8 h-8 border flex items-center justify-center"
              >
                -
              </button>

              <span className="w-8 text-center">{item.quantity}</span>

              <button
                onClick={() =>
                  updateQty(
                    item.productId,
                    Math.min(item.quantity + 1, item.stockQty),
                    item.itemId
                  )
                }
                className="w-8 h-8 border flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Price */}
            <div className="col-span-4 md:col-span-2 text-right">
              ${item.price.toFixed(2)}
            </div>

            {/* Total */}
            <div className="col-span-4 md:col-span-2 text-right font-medium">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t mt-6 pt-6">
        <div className="flex justify-between mb-2">
          <span>
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="text-xl font-semibold">
            ${total.toFixed(2)}
          </span>
        </div>

        {!user && (
          <p className="text-xs text-brand-400 mb-4">
            You need to{" "}
            <Link to="/login" className="underline">
              sign in
            </Link>{" "}
            before placing an order.
          </p>
        )}

        <button
          disabled={!user}
          className="btn-primary w-full mt-4"
          onClick={() => navigate("/checkout")}
        >
          {user ? "Proceed to Payment" : "Sign in to Checkout"}
        </button>

        <Link
          to="/"
          className="block text-center text-xs mt-4"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}