import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page auth-page">
      <h1>Create a Bidshop account</h1>
      <form onSubmit={onSubmit} className="auth-form" data-testid="register-form">
        <label>
          Full name
          <input
            type="text"
            value={name}
            required
            data-testid="register-name"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            required
            data-testid="register-email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password (min 6 chars)
          <input
            type="password"
            value={password}
            required
            minLength={6}
            data-testid="register-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="auth-form__error" data-testid="register-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={submitting} data-testid="register-submit">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>.
      </p>
    </section>
  );
}
