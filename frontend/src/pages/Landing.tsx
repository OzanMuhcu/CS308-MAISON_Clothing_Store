import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";

export default function Landing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/products"),
      api.get("/products/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p.data);
        setCategories(c.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (category) {
      list = list.filter((p) => p.category === category);
    }

    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, search, category, sort]);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-brand-900 text-brand-50 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, transparent 75%)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-400 mb-4">
            New Season
          </p>
          <h1 className="font-display text-5xl lg:text-7xl font-semibold leading-[1.1] max-w-3xl">
            Considered clothing for modern living
          </h1>
          <p className="mt-6 text-brand-300 text-lg max-w-xl leading-relaxed font-light">
            Quality materials, timeless design, and responsible production.
            Pieces built to be worn, not discarded.
          </p>
          <a href="#collection" className="btn-secondary border-brand-50 text-brand-50 hover:bg-brand-50 hover:text-brand-900 mt-8 inline-flex">
            View Collection
          </a>
        </div>
      </section>

      {/* Collection */}
      <section id="collection" className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-brand-400 mb-2">
              Collection
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-brand-900">
              All Products
            </h2>
          </div>

          <p className="text-sm text-brand-400">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-xs"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field max-w-[180px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field max-w-[180px]"
          >
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-400 text-sm">
              No products found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
