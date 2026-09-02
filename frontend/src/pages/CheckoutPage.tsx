import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { OrderResponse } from '../types';

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderResponse | null>(null);

  if (!user) {
    return (
      <section className="page checkout-page">
        <h1>Checkout</h1>
        <p>
          Please <Link to="/login">log in</Link> to checkout.
        </p>
      </section>
    );
  }

  if (confirmation) {
    return (
      <section className="page checkout-page">
        <h1>Order confirmed</h1>
        <p data-testid="order-confirmation">
          Thanks {confirmation.customer.name}! Your order{' '}
          <strong data-testid="order-id">#{confirmation.id}</strong> has been placed.
        </p>
        <p>
          Total charged: <strong data-testid="order-total">${confirmation.total.toFixed(2)}</strong>
        </p>
        <Link to="/" className="btn btn--primary">
          Continue shopping
        </Link>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="page checkout-page">
        <h1>Checkout</h1>
        <p data-testid="checkout-empty">
          Your cart is empty. <Link to="/">Browse products</Link>.
        </p>
      </section>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.placeOrder({ name, email, address, city, postcode });
      setConfirmation(order);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form onSubmit={onSubmit} className="auth-form" data-testid="checkout-form">
          <h2>Delivery details</h2>
          <label>
            Full name
            <input value={name} required data-testid="checkout-name" onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              required
              data-testid="checkout-email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Street address
            <input
              value={address}
              required
              data-testid="checkout-address"
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label>
            City
            <input value={city} required data-testid="checkout-city" onChange={(e) => setCity(e.target.value)} />
          </label>
          <label>
            Postcode (4 digits)
            <input
              value={postcode}
              required
              pattern="\d{4}"
              data-testid="checkout-postcode"
              onChange={(e) => setPostcode(e.target.value)}
            />
          </label>
          {error && (
            <p className="auth-form__error" data-testid="checkout-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
            data-testid="checkout-submit"
          >
            {submitting ? 'Placing order…' : `Place order – $${cart.total.toFixed(2)}`}
          </button>
        </form>

        <aside className="checkout-summary" data-testid="checkout-summary">
          <h2>Order summary</h2>
          <ul>
            {cart.items.map((line) => (
              <li key={line.productId} data-testid={`checkout-line-${line.productId}`}>
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span>${line.lineTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div>
            <span>Subtotal</span>
            <span data-testid="checkout-subtotal">${cart.subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>GST (15%)</span>
            <span data-testid="checkout-gst">${cart.gst.toFixed(2)}</span>
          </div>
          <div className="checkout-summary__total">
            <span>Total</span>
            <span data-testid="checkout-total">${cart.total.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
