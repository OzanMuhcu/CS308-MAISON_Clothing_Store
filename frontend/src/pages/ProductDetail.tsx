import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import type { Product, ProductReviews, MyReviewData, WishlistItem, WishlistList } from "../types";
import { getCategoryFallback } from "../utils/imageUtils";

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "w-5 h-5",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${size} ${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
        >
          <svg
            viewBox="0 0 24 24"
            fill={(hover || value) >= star ? "#d4a574" : "none"}
            stroke={(hover || value) >= star ? "#d4a574" : "#c4b5a3"}
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

const STAR_PATH =
  "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z";

const isDiscountActive = (product: Product) => {
  if (!product.discount || product.discount <= 0) return false;
  const now = new Date();
  const startsAt = product.discountStartsAt ? new Date(product.discountStartsAt) : null;
  const endsAt = product.discountEndsAt ? new Date(product.discountEndsAt) : null;
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  return true;
};

const getDiscountedPrice = (product: Product) => {
  const next = product.price * (1 - product.discount / 100);
  return Math.max(0, Math.round(next * 100) / 100);
};

function DisplayRating({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  const normalized = Math.max(0, Math.min(5, value));
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, normalized - (star - 1)));
        return (
          <div key={star} className={`relative ${size} shrink-0`}>
            <svg className="absolute inset-0" viewBox="0 0 24 24" fill="none" stroke="#c4b5a3" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
            </svg>
            {fill > 0 && fill < 1 && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg
                  style={{ position: "absolute", top: 0, left: 0, width: `${(1 / fill) * 100}%`, height: "100%" }}
                  viewBox="0 0 24 24"
                  fill="#d4a574"
                  stroke="#d4a574"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
                </svg>
              </div>
            )}
            {fill === 1 && (
              <svg className="absolute inset-0" viewBox="0 0 24 24" fill="#d4a574" stroke="#d4a574" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlists, setWishlists] = useState<WishlistList[]>([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistPickerOpen, setWishlistPickerOpen] = useState(false);
  const [wishlistNotice, setWishlistNotice] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState<ProductReviews | null>(null);
  const [myReview, setMyReview] = useState<MyReviewData | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch reviews (public)
  useEffect(() => {
    if (!id) return;
    api.get(`/reviews/product/${id}`).then((r) => setReviews(r.data)).catch(() => {});
  }, [id]);

  // Fetch my review data (auth only)
  useEffect(() => {
    if (!id || !user) return;
    api.get(`/reviews/my/${id}`).then((r) => setMyReview(r.data)).catch(() => {});
  }, [id, user]);

  // Load wishlists for the user
  useEffect(() => {
    if (!user) {
      setWishlists([]);
      setSelectedWishlistId(null);
      setWishlistItems([]);
      setInWishlist(false);
      return;
    }
    api
      .get("/wishlists")
      .then((r) => {
        const data: WishlistList[] = r.data || [];
        setWishlists(data);
        if (data.length > 0) {
          setSelectedWishlistId((prev) => prev ?? data[0].id);
        } else {
          setSelectedWishlistId(null);
        }
      })
      .catch(() => {
        setWishlists([]);
        setSelectedWishlistId(null);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !selectedWishlistId) {
      setWishlistItems([]);
      setInWishlist(false);
      return;
    }
    api
      .get(`/wishlists/${selectedWishlistId}/items`)
      .then((r) => setWishlistItems(r.data || []))
      .catch(() => setWishlistItems([]));
  }, [user, selectedWishlistId]);

  useEffect(() => {
    if (!product || !selectedWishlistId) {
      setInWishlist(false);
      return;
    }
    const found = wishlistItems.some((item) => item.productId === product.id);
    setInWishlist(found);
  }, [product, selectedWishlistId, wishlistItems]);

  const handleAdd = async () => {
    if (!product || product.stockQty <= 0) return;
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        name: product.name,
        price: isDiscountActive(product) ? getDiscountedPrice(product) : product.price,
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

  const toggleWishlist = async () => {
    if (!product || !user || wishlistLoading || !selectedWishlistId) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/wishlists/${selectedWishlistId}/items/${product.id}`);
        setInWishlist(false);
        setWishlistItems((prev) => prev.filter((i) => i.productId !== product.id));
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
      }
    } catch {
      /* ignore */
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleWishlistTrigger = () => {
    setWishlistPickerOpen((prev) => !prev);
  };

  const handleWishlistAction = async () => {
    if (!product || !user || !selectedWishlistId) return;
    setWishlistNotice("");
    await toggleWishlist();
    setWishlistNotice(inWishlist ? "Removed from wishlist." : "Added to wishlist.");
    setTimeout(() => setWishlistNotice(""), 2000);
  };

  const handleRate = async (value: number) => {
    if (!product || submittingRating) return;
    setSubmittingRating(true);
    try {
      const { data } = await api.post("/reviews/rate", { productId: product.id, value });
      setMyReview((prev) => prev ? { ...prev, myRating: value } : prev);
      setReviews((prev) =>
        prev ? { ...prev, avgRating: data.avgRating, ratingCount: data.ratingCount } : prev
      );
      setProduct((prev) =>
        prev ? { ...prev, avgRating: data.avgRating, ratingCount: data.ratingCount } : prev
      );
      setReviewMessage("Rating submitted!");
      setTimeout(() => setReviewMessage(""), 3000);
    } catch (err: any) {
      setReviewMessage(err.response?.data?.error || "Failed to submit rating");
      setTimeout(() => setReviewMessage(""), 3000);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleComment = async () => {
    if (!product || !commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await api.post("/reviews/comment", { productId: product.id, text: commentText.trim() });
      setCommentText("");
      setReviewMessage("Comment submitted! It will be visible after approval.");
      // Refresh my review data
      const { data } = await api.get(`/reviews/my/${id}`);
      setMyReview(data);
      setTimeout(() => setReviewMessage(""), 5000);
    } catch (err: any) {
      setReviewMessage(err.response?.data?.error || "Failed to submit comment");
      setTimeout(() => setReviewMessage(""), 3000);
    } finally {
      setSubmittingComment(false);
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
  const lowStock = product.stockQty > 0 && product.stockQty < 5;
  const discountActive = isDiscountActive(product);

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
        <div className="aspect-[3/4] bg-brand-100 overflow-hidden relative">
          <img
            src={product.imageUrl || getCategoryFallback(product.category)}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const fallback = getCategoryFallback(product.category);
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== fallback) {
                img.onerror = null;
                img.src = fallback;
              }
            }}
          />
          {/* Wishlist button overlay */}
          {user && (
            <div className="absolute top-4 right-4">
              <button
                onClick={handleWishlistTrigger}
                className="w-10 h-10 flex items-center justify-center bg-white/90 border border-brand-200 rounded-full shadow-sm transition-all hover:shadow-md"
                title="Choose wishlist"
              >
                <svg
                  width="18"
                  height="18"
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
              {wishlistPickerOpen && (
                <div className="mt-2 w-48 bg-white border border-brand-200 shadow-lg p-3 text-xs text-brand-600">
                  {wishlists.length === 0 ? (
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
                        disabled={wishlistLoading || !selectedWishlistId}
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
        </div>

        {/* Details */}
        <div className="lg:py-8">
          <p className="text-[11px] tracking-[0.2em] uppercase text-brand-400 mb-3">
            {product.category}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-brand-900 mb-4">
            {product.name}
          </h1>

          {/* Rating summary */}
          {reviews && reviews.ratingCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <DisplayRating value={reviews.avgRating} size="w-4 h-4" />
              <span className="text-sm text-brand-600">
                {reviews.avgRating.toFixed(1)} ({reviews.ratingCount} {reviews.ratingCount === 1 ? "rating" : "ratings"})
              </span>
            </div>
          )}

          {discountActive ? (
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <p className="text-xl text-brand-900 font-medium">
                  ${getDiscountedPrice(product).toFixed(2)}
                </p>
                <p className="text-sm text-brand-400 line-through">
                  ${product.price.toFixed(2)}
                </p>
                <span className="text-xs tracking-widest uppercase bg-brand-900 text-brand-50 px-2 py-1">
                  {product.discount.toFixed(0)}% Off
                </span>
              </div>
              {(product.discountName || product.discountType || product.discountStartsAt || product.discountEndsAt) && (
                <p className="text-xs text-brand-500 mt-2">
                  {product.discountName ? product.discountName : "Campaign"}
                  {product.discountType ? ` · ${product.discountType}` : ""}
                  {product.discountStartsAt ? ` · Starts ${new Date(product.discountStartsAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}` : ""}
                  {product.discountEndsAt ? ` · Ends ${new Date(product.discountEndsAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}` : ""}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xl text-brand-700 mb-6">
              ${product.price.toFixed(2)}
            </p>
          )}

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
              <span className={`font-medium ${outOfStock ? "text-red-600" : lowStock ? "text-amber-600" : "text-green-600"}`}>
                {outOfStock ? "Out of Stock" : lowStock ? `Only ${product.stockQty} left` : `${product.stockQty} in stock`}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-brand-100 text-sm">
              <span className="text-brand-500">Category</span>
              <span className="text-brand-900">{product.category}</span>
            </div>
            {product.model && (
              <div className="flex justify-between py-3 border-b border-brand-100 text-sm">
                <span className="text-brand-500">Model</span>
                <span className="text-brand-900">{product.model}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-b border-brand-100 text-sm">
              <span className="text-brand-500">Serial Number</span>
              <span className="text-brand-900 font-mono text-xs">{product.serialNumber}</span>
            </div>
            {product.warrantyStatus && product.warrantyStatus !== "None" && (
              <div className="flex justify-between py-3 border-b border-brand-100 text-sm">
                <span className="text-brand-500">Warranty</span>
                <span className="text-brand-900">{product.warrantyStatus}</span>
              </div>
            )}
            {product.distributorInfo && (
              <div className="flex justify-between py-3 text-sm">
                <span className="text-brand-500">Distributor</span>
                <span className="text-brand-900 text-right max-w-[60%]">{product.distributorInfo}</span>
              </div>
            )}
          </div>

          {/* Add to cart */}
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={outOfStock || added}
              className="btn-primary flex-1"
            >
              {outOfStock
                ? "Sold Out"
                : added
                ? "Added to Cart"
                : "Add to Cart"}
            </button>
            {user && (
              <button
                onClick={handleWishlistTrigger}
                className={`px-4 border transition-colors ${
                  inWishlist
                    ? "border-red-300 text-red-500 hover:bg-red-50"
                    : "border-brand-300 text-brand-500 hover:bg-brand-50"
                }`}
                title="Choose wishlist"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={inWishlist ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </button>
            )}
          </div>

          {!outOfStock && (
            <p className="text-xs text-brand-400 text-center mt-3">
              Unit price: ${product.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* ─── Reviews & Comments Section ─── */}
      <div className="mt-16 border-t border-brand-200 pt-12">
        <h2 className="font-display text-2xl font-semibold text-brand-900 mb-8">
          Reviews & Comments
        </h2>

        {/* Review message */}
        {reviewMessage && (
          <div className="mb-6 px-4 py-3 bg-brand-100 border border-brand-200 text-sm text-brand-700 rounded">
            {reviewMessage}
          </div>
        )}

        {/* User's rating & comment form */}
        {user && myReview?.canReview && (
          <div className="bg-white border border-brand-200 p-6 mb-8">
            <h3 className="text-sm font-semibold text-brand-900 tracking-wide uppercase mb-4">
              Your Review
            </h3>

            {/* Rating */}
            <div className="mb-5">
              <label className="text-sm text-brand-600 block mb-2">Your Rating</label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={myReview.myRating ?? 0}
                  onChange={handleRate}
                />
                {submittingRating && (
                  <div className="w-4 h-4 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
                )}
                {myReview.myRating && (
                  <span className="text-xs text-brand-500">
                    You rated {myReview.myRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm text-brand-600 block mb-2">Leave a Comment</label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="input-field w-full h-24 resize-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-brand-400">{commentText.length}/2000</span>
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="btn-primary text-xs px-5 py-2 disabled:opacity-50"
                >
                  {submittingComment ? "Submitting..." : "Submit Comment"}
                </button>
              </div>
            </div>

            {/* User's existing comments */}
            {myReview.myComments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-brand-100">
                <p className="text-xs text-brand-500 uppercase tracking-wide mb-3">Your Comments</p>
                {myReview.myComments.map((c) => (
                  <div key={c.id} className="mb-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                        c.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : c.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {c.status}
                      </span>
                      <span className="text-xs text-brand-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-brand-700">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user && myReview && !myReview.canReview && (
          <div className="bg-brand-50 border border-brand-200 px-6 py-4 mb-8 text-sm text-brand-600">
            You can leave a review only after purchasing this product and receiving your order.
          </div>
        )}

        {!user && (
          <div className="bg-brand-50 border border-brand-200 px-6 py-4 mb-8 text-sm text-brand-600">
            <Link to="/login" className="text-brand-900 underline underline-offset-2">Sign in</Link> to leave a review.
          </div>
        )}

        {/* Approved comments list */}
        {reviews && reviews.comments.length > 0 ? (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-brand-900 tracking-wide uppercase">
              Comments ({reviews.comments.length})
            </h3>
            {reviews.comments.map((c) => (
              <div key={c.id} className="border-b border-brand-100 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-[10px] font-semibold">
                    {c.userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                  <span className="text-sm font-medium text-brand-900">{c.userName}</span>
                  <span className="text-xs text-brand-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-brand-700 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-400">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  );
}
