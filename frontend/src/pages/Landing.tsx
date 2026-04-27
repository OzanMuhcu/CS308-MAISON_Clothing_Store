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
    Promise.all([api.get("/products"), api.get("/products/categories")])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (category) list = list.filter((p) => p.category === category);
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "rating_desc") list.sort((a, b) => b.avgRating - a.avgRating);
    return list;
  }, [products, search, category, sort]);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-brand-900 text-brand-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <p className="text-[11px] tracking-[0.3em] uppercase text-brand-400 mb-5">New Season</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] max-w-2xl">
            Considered clothing for modern living
          </h1>
          <p className="mt-5 text-brand-300 text-base lg:text-lg max-w-lg leading-relaxed font-light">
            Quality materials, timeless design, and responsible production.
          </p>
          <a href="#collection" className="inline-flex items-center gap-2 mt-8 px-6 py-3 border border-brand-400 text-brand-100 text-sm tracking-wider uppercase font-medium transition-all hover:bg-brand-50 hover:text-brand-900 hover:border-brand-50">
            Shop Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </section>

      {/* Collection */}
      <section id="collection" className="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold text-brand-900">Collection</h2>
          <p className="text-sm text-brand-400">{filtered.length} {filtered.length === 1 ? "piece" : "pieces"}</p>
        </div>

        {/* Filters row: search, category dropdown, sort dropdown */}
        <div className="flex flex-wrap gap-3 mb-10">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field max-w-[200px]">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field max-w-[200px]">
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="rating_desc">Rating: Highest</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20"><p className="text-brand-500 text-sm">No products found matching your criteria.</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
