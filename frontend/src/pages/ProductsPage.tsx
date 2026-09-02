import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../api';
import { Product } from '../types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const handle = window.setTimeout(() => {
      api
        .listProducts({ search: search || undefined, category: category || undefined })
        .then((res) => setProducts(res.items))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load products'))
        .finally(() => setLoading(false));
    }, 200); // small debounce on search
    return () => window.clearTimeout(handle);
  }, [search, category]);

  const summary = useMemo(() => {
    if (loading) return 'Loading products…';
    if (error) return `Error: ${error}`;
    return `${products.length} product${products.length === 1 ? '' : 's'}`;
  }, [loading, error, products]);

  return (
    <section className="page products-page">
      <header className="hero">
        <div className="hero__content">
          <h1>Fresh food, delivered to your kitchen.</h1>
          <p>
            Bidshop supplies cafes, restaurants and foodservice businesses across Aotearoa with
            quality ingredients from trusted local suppliers.
          </p>
        </div>
      </header>

      <div className="filters" data-testid="filters">
        <input
          type="search"
          placeholder="Search products…"
          className="filters__search"
          value={search}
          data-testid="filter-search"
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filters__category"
          value={category}
          data-testid="filter-category"
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="filters__summary" data-testid="filter-summary">
          {summary}
        </span>
      </div>

      <div className="product-grid" data-testid="product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {!loading && products.length === 0 && !error && (
          <p className="empty-state" data-testid="empty-state">
            No products match your filters.
          </p>
        )}
      </div>
    </section>
  );
}
