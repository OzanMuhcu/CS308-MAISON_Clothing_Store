import { useState, useEffect } from "react";
import api from "../services/api";
import type { Category } from "../types";

type Tab = "products" | "categories" | "orders" | "comments";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  category: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "orders", label: "Orders" },
  { key: "comments", label: "Comments" },
];

export default function ProductManagerAdmin() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  useEffect(() => {
    if (tab === "products" || tab === "categories") {
      setLoading(true);
      api
        .get("/products")
        .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "categories") return;
    setCategoriesLoading(true);
    api
      .get("/categories")
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, [tab]);

  const productCountFor = (name: string) =>
    products.filter((p) => p.category === name).length;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError("Category name is required.");
      return;
    }
    setCategoryError(null);
    setCreatingCategory(true);
    try {
      const { data } = await api.post<Category>("/categories", { name });
      // Insert sorted by name to match server ordering.
      setCategories((prev) =>
        [...prev.filter((c) => c.id !== data.id), data].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewCategoryName("");
    } catch (err: any) {
      setCategoryError(err?.response?.data?.error || "Failed to create category.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const count = productCountFor(cat.name);
    const productNote =
      count > 0
        ? `\n\n${count} product${count !== 1 ? "s" : ""} currently in this category will be hidden from the storefront.`
        : "";
    if (!window.confirm(`Remove "${cat.name}" from the storefront?${productNote}`)) {
      return;
    }
    setDeletingCategoryId(cat.id);
    setCategoryError(null);
    try {
      await api.delete(`/categories/${cat.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err: any) {
      setCategoryError(err?.response?.data?.error || "Failed to remove category.");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-8">
        Product Manager
      </h1>

      {/* Tab bar */}
      <div className="flex gap-6 border-b border-brand-200 mb-8">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-brand-400 hover:text-brand-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Products */}
      {tab === "products" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-brand-900">All Products</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-200">
                    <th className="text-left py-3 text-brand-500 font-medium">SKU</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Name</th>
                    <th className="text-left py-3 text-brand-500 font-medium">Category</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Price</th>
                    <th className="text-right py-3 text-brand-500 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-brand-100 hover:bg-brand-50 transition-colors"
                    >
                      <td className="py-3 font-mono text-xs text-brand-500">{p.sku}</td>
                      <td className="py-3 font-medium text-brand-900">{p.name}</td>
                      <td className="py-3 text-brand-600">{p.category}</td>
                      <td className="py-3 text-right text-brand-900">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td
                        className={`py-3 text-right ${
                          p.stockQty === 0 ? "text-red-500" : "text-brand-900"
                        }`}
                      >
                        {p.stockQty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <p className="text-center text-brand-400 py-12 text-sm">No products found.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Categories */}
      {tab === "categories" && (
        <>
          <h2 className="text-xl font-semibold text-brand-900 mb-6">Categories</h2>

          <form
            onSubmit={handleCreateCategory}
            className="border border-brand-200 bg-white p-5 mb-6"
          >
            <label className="input-label" htmlFor="new-category-name">
              Add a New Category
            </label>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <input
                id="new-category-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Outerwear"
                className="input-field flex-1"
                maxLength={60}
                disabled={creatingCategory}
              />
              <button
                type="submit"
                disabled={creatingCategory || !newCategoryName.trim()}
                className="btn-primary whitespace-nowrap"
              >
                {creatingCategory ? "Adding..." : "Add Category"}
              </button>
            </div>
            {categoryError && <p className="input-error mt-3">{categoryError}</p>}
          </form>

          {categoriesLoading || loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = productCountFor(cat.name);
                const isDeleting = deletingCategoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`border border-brand-200 p-5 bg-white flex flex-col justify-between gap-3 transition-opacity ${
                      isDeleting ? "opacity-50" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium text-brand-900">{cat.name}</p>
                      <p className="text-sm text-brand-400 mt-1">
                        {count} product{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      disabled={isDeleting}
                      className="text-xs tracking-widest uppercase text-red-600 hover:text-red-800 transition-colors self-start"
                    >
                      {isDeleting ? "Removing..." : "Remove"}
                    </button>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="text-brand-400 col-span-full py-12 text-center text-sm">
                  No categories yet — add one above.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Orders — stub for future sprint */}
      {tab === "orders" && (
        <div className="py-20 text-center">
          <p className="text-brand-400 text-sm">
            Order management for product managers will be available in a future update.
          </p>
        </div>
      )}

      {/* Comments — stub for future sprint */}
      {tab === "comments" && (
        <div className="py-20 text-center">
          <p className="text-brand-400 text-sm">
            Comment moderation will be available in a future update.
          </p>
        </div>
      )}
    </div>
  );
}
