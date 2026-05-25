import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFormErrors } from '../hooks/useFormErrors';

export function RegistrationPage() {
  const navigate = useNavigate();
  const { generalError, setError, clearErrors, field } = useFormErrors();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      await authApi.registration({ login, password, email });
      setSuccess(true);
      navigate('/registration-confirmation');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="card">
        <h1 className="form-title">Sign Up</h1>
        {success && (
          <div className="success-banner">
            Registration successful. Check your email for confirmation code.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <Input
            label="Login"
            name="login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            error={field('login')}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={field('password')}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={field('email')}
            required
          />
          {generalError && <div className="error-banner">{generalError}</div>}
          <Button type="submit" block disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
        <p className="form-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
