import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { user } = useAuth();
  const { cart, updateItem, removeItem, clear } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <section className="page cart-page">
        <h1>Your cart</h1>
        <p data-testid="cart-login-required">
          Please <Link to="/login">log in</Link> to view your cart.
        </p>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="page cart-page">
        <h1>Your cart</h1>
        <p data-testid="cart-empty">Your cart is empty. Head back to the <Link to="/">shop</Link> to add some goodies.</p>
      </section>
    );
  }

  return (
    <section className="page cart-page">
      <h1>Your cart</h1>
      <table className="cart-table" data-testid="cart-table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Unit price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Line total</th>
            <th scope="col" aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {cart.items.map((line) => (
            <tr key={line.productId} data-testid={`cart-row-${line.productId}`}>
              <td>
                <div className="cart-table__product">
                  {line.imageUrl && <img src={line.imageUrl} alt="" />}
                  <div>
                    <div className="cart-table__name" data-testid={`cart-name-${line.productId}`}>
                      {line.name}
                    </div>
                    <div className="cart-table__unit">{line.unit}</div>
                  </div>
                </div>
              </td>
              <td data-testid={`cart-unit-price-${line.productId}`}>${line.unitPrice.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  className="cart-table__qty"
                  data-testid={`cart-qty-${line.productId}`}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    if (Number.isInteger(q) && q > 0) updateItem(line.productId, q).catch(() => {});
                  }}
                />
              </td>
              <td data-testid={`cart-line-total-${line.productId}`}>${line.lineTotal.toFixed(2)}</td>
              <td>
                <button
                  type="button"
                  className="btn btn--ghost"
                  data-testid={`cart-remove-${line.productId}`}
                  onClick={() => removeItem(line.productId).catch(() => {})}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart-summary" data-testid="cart-summary">
        <div>
          <span>Subtotal</span>
          <span data-testid="cart-subtotal">${cart.subtotal.toFixed(2)}</span>
        </div>
        <div>
          <span>GST (15%)</span>
          <span data-testid="cart-gst">${cart.gst.toFixed(2)}</span>
        </div>
        <div className="cart-summary__total">
          <span>Total</span>
          <span data-testid="cart-total">${cart.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button
          type="button"
          className="btn btn--ghost"
          data-testid="cart-clear"
          onClick={() => clear().catch(() => {})}
        >
          Clear cart
        </button>
        <button
          type="button"
          className="btn btn--primary"
          data-testid="cart-checkout"
          onClick={() => navigate('/checkout')}
        >
          Continue to checkout
        </button>
      </div>
    </section>
  );
}
