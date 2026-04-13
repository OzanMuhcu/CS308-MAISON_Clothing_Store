import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";

export default function Landing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/products/categories")])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, search, activeCategory, sort]);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-brand-900 text-brand-50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <p className="text-[11px] tracking-[0.3em] uppercase text-brand-400 mb-5 font-body">
            New Season Collection
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] max-w-2xl">
            Considered clothing for modern living
          </h1>
          <p className="mt-5 text-brand-300 text-base lg:text-lg max-w-lg leading-relaxed font-light font-body">
            Quality materials, timeless design, and responsible production.
            Pieces built to be worn, not discarded.
          </p>
          <a
            href="#collection"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 border border-brand-400 text-brand-100 text-sm tracking-wider uppercase font-medium transition-all duration-200 hover:bg-brand-50 hover:text-brand-900 hover:border-brand-50"
          >
            Shop Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </section>

      {/* Collection */}
      <section id="collection" className="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold text-brand-900">
              Collection
            </h2>
          </div>
          <p className="text-sm text-brand-400 font-body">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setActiveCategory("")}
            className={`flex-shrink-0 px-4 py-2 text-xs tracking-wider uppercase font-medium transition-colors duration-150 border ${
              activeCategory === ""
                ? "bg-brand-900 text-brand-50 border-brand-900"
                : "bg-transparent text-brand-600 border-brand-200 hover:border-brand-500"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? "" : cat)}
              className={`flex-shrink-0 px-4 py-2 text-xs tracking-wider uppercase font-medium transition-colors duration-150 border ${
                activeCategory === cat
                  ? "bg-brand-900 text-brand-50 border-brand-900"
                  : "bg-transparent text-brand-600 border-brand-200 hover:border-brand-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-wrap gap-3 mb-10">
          <div className="relative max-w-xs flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field max-w-[200px]"
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
            <p className="text-brand-500 text-sm font-body">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
