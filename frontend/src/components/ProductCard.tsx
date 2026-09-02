import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onAdd = async () => {
    setMessage(null);
    setAdding(true);
    try {
      await addItem(product.id, 1);
      setMessage('Added to cart');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setAdding(false);
      setTimeout(() => setMessage(null), 2500);
    }
  };

  return (
    <article className="product-card" data-testid={`product-card-${product.id}`}>
      <img
        className="product-card__image"
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
      />
      <div className="product-card__body">
        <span className="product-card__category" data-testid={`product-category-${product.id}`}>
          {product.category}
        </span>
        <h3 className="product-card__name" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="product-card__desc">{product.description}</p>
        <div className="product-card__meta">
          <span className="product-card__price" data-testid={`product-price-${product.id}`}>
            ${product.price.toFixed(2)}
          </span>
          <span className="product-card__unit">/ {product.unit}</span>
        </div>
        <div className="product-card__stock" data-testid={`product-stock-${product.id}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </div>
        {user ? (
          <button
            type="button"
            className="btn btn--primary product-card__cta"
            disabled={adding || product.stock === 0}
            data-testid={`product-add-${product.id}`}
            onClick={onAdd}
          >
            {adding ? 'Adding…' : 'Add to cart'}
          </button>
        ) : (
          <Link to="/login" className="btn btn--primary product-card__cta" data-testid={`product-login-${product.id}`}>
            Log in to buy
          </Link>
        )}
        {message && (
          <p className="product-card__message" data-testid={`product-message-${product.id}`}>
            {message}
          </p>
        )}
      </div>
    </article>
  );
}
