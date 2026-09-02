import { Router } from 'express';
import { store } from '../data/store';

const router = Router();

/**
 * GET /products
 * Optional query params:
 *   search   – case-insensitive substring match on name/description
 *   category – exact category match (e.g. "Dairy")
 *   minPrice – number, inclusive
 *   maxPrice – number, inclusive
 *   inStock  – "true" to only return products where stock > 0
 */
router.get('/', (req, res) => {
  const { search, category, minPrice, maxPrice, inStock } = req.query;

  let results = [...store.products];

  if (typeof search === 'string' && search.trim().length > 0) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }

  if (typeof category === 'string' && category.length > 0) {
    results = results.filter((p) => p.category === category);
  }

  if (typeof minPrice === 'string') {
    const min = Number(minPrice);
    if (!Number.isNaN(min)) results = results.filter((p) => p.price >= min);
  }

  if (typeof maxPrice === 'string') {
    const max = Number(maxPrice);
    if (!Number.isNaN(max)) results = results.filter((p) => p.price <= max);
  }

  if (typeof inStock === 'string' && inStock.toLowerCase() === 'true') {
    results = results.filter((p) => p.stock > 0);
  }

  return res.json({ count: results.length, items: results });
});

router.get('/categories', (_req, res) => {
  const categories = Array.from(new Set(store.products.map((p) => p.category))).sort();
  return res.json({ categories });
});

router.get('/:id', (req, res) => {
  const product = store.findProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
});

export default router;
