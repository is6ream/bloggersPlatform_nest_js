import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFormErrors } from '../hooks/useFormErrors';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { generalError, setError, clearErrors, field } = useFormErrors();
  const [loginOrEmail, setLoginOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      await login(loginOrEmail, password);
      navigate('/blogs');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="card">
        <h1 className="form-title">Sign In</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="Login or Email"
            name="loginOrEmail"
            value={loginOrEmail}
            onChange={(e) => setLoginOrEmail(e.target.value)}
            error={field('loginOrEmail')}
            required
            autoComplete="username"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={field('password')}
            required
            autoComplete="current-password"
          />
          {generalError && <div className="error-banner">{generalError}</div>}
          <Button type="submit" block disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="form-footer">
          <Link to="/password-recovery">Forgot password?</Link>
        </p>
        <p className="form-footer">
          Don&apos;t have an account? <Link to="/registration">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
