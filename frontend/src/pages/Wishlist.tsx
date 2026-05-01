import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import type { WishlistItem, WishlistList } from "../types";

export default function Wishlist() {
  const [searchParams] = useSearchParams();
  const [lists, setLists] = useState<WishlistList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [listError, setListError] = useState("");

  const fetchLists = () => {
    setLoadingLists(true);
    api
      .get("/wishlists")
      .then((r) => {
        const data: WishlistList[] = r.data || [];
        setLists(data);
        if (data.length > 0) {
          setSelectedListId((prev) => prev ?? data[0].id);
        } else {
          setSelectedListId(null);
          setItems([]);
          setLoadingItems(false);
        }
      })
      .catch(() => {
        setLists([]);
        setSelectedListId(null);
        setItems([]);
        setLoadingItems(false);
      })
      .finally(() => setLoadingLists(false));
  };

  const fetchItems = (listId: number) => {
    setLoadingItems(true);
    api
      .get(`/wishlists/${listId}/items`)
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  };

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    const listParam = searchParams.get("list");
    if (!listParam || lists.length === 0) return;
    const parsed = Number(listParam);
    if (!Number.isNaN(parsed) && lists.some((l) => l.id === parsed)) {
      setSelectedListId(parsed);
    }
  }, [lists, searchParams]);

  useEffect(() => {
    if (selectedListId) {
      fetchItems(selectedListId);
    }
  }, [selectedListId]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) {
      setListError("Wishlist name is required");
      return;
    }
    setListError("");
    try {
      const { data } = await api.post("/wishlists", { name });
      const created: WishlistList = data.wishlist;
      setLists((prev) => [created, ...prev]);
      setSelectedListId(created.id);
      setNewListName("");
    } catch (err: any) {
      setListError(err.response?.data?.error || "Failed to create wishlist");
    }
  };

  const handleDeleteList = async () => {
    if (!selectedListId) return;
    if (!window.confirm("Delete this wishlist?")) return;
    try {
      await api.delete(`/wishlists/${selectedListId}`);
      const remaining = lists.filter((l) => l.id !== selectedListId);
      setLists(remaining);
      if (remaining.length > 0) {
        setSelectedListId(remaining[0].id);
      } else {
        setSelectedListId(null);
        setItems([]);
      }
    } catch {
      /* ignore */
    }
  };

  const handleRemove = async (productId: number) => {
    if (!selectedListId) return;
    try {
      await api.delete(`/wishlists/${selectedListId}/items/${productId}`);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      setLists((prev) =>
        prev.map((l) =>
          l.id === selectedListId ? { ...l, itemCount: Math.max(0, l.itemCount - 1) } : l
        )
      );
    } catch {
      /* ignore */
    }
  };

  if (loadingLists) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-6">
        My Wishlists
      </h1>

      <form onSubmit={handleCreateList} className="border border-brand-200 p-5 mb-8">
        <label className="input-label">Create a New Wishlist</label>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Summer Essentials"
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Create Wishlist
          </button>
        </div>
        {listError && <p className="input-error mt-2">{listError}</p>}
      </form>

      {lists.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-brand-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-brand-500 text-sm mb-4">Create a wishlist to start saving items.</p>
          <Link to="/" className="text-brand-900 underline underline-offset-2 text-sm">
            Browse products
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
            <div className="flex-1">
              <label className="input-label">Select Wishlist</label>
              <select
                value={selectedListId ?? ""}
                onChange={(e) => setSelectedListId(Number(e.target.value))}
                className="input-field"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.itemCount})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleDeleteList}
              className="text-xs tracking-widest uppercase text-red-600 hover:text-red-800 transition-colors self-start md:self-end"
            >
              Delete this wishlist
            </button>
          </div>

          {loadingItems ? (
            <div className="flex justify-center py-24">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 border border-brand-100">
              <p className="text-brand-500 text-sm">This wishlist is empty.</p>
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
      )}
    </div>
  );
}
