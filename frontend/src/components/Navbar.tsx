import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <header className="navbar" data-testid="navbar">
      <Link to="/" className="navbar__brand" data-testid="nav-home">
        <span className="navbar__logo">B</span>
        <span className="navbar__brand-text">Bidshop</span>
      </Link>

      <nav className="navbar__links">
        <NavLink to="/" end data-testid="nav-products">
          Shop
        </NavLink>
        <NavLink to="/cart" data-testid="nav-cart">
          Cart
          {itemCount > 0 && (
            <span className="navbar__badge" data-testid="nav-cart-count">
              {itemCount}
            </span>
          )}
        </NavLink>
      </nav>

      <div className="navbar__auth">
        {user ? (
          <>
            <span data-testid="nav-user-name">Kia ora, {user.name.split(' ')[0]}</span>
            <button
              type="button"
              className="btn btn--ghost"
              data-testid="nav-logout"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn--ghost" data-testid="nav-login">
              Log in
            </Link>
            <Link to="/register" className="btn btn--primary" data-testid="nav-register">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
