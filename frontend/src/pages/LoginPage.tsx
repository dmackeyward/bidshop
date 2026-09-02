import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page auth-page">
      <h1>Log in to Bidshop</h1>
      <form onSubmit={onSubmit} className="auth-form" data-testid="login-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            required
            data-testid="login-email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            required
            data-testid="login-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="auth-form__error" data-testid="login-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={submitting} data-testid="login-submit">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        Don&apos;t have an account? <Link to="/register">Register here</Link>.
      </p>
    </section>
  );
}
