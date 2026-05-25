import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFormErrors } from '../hooks/useFormErrors';

export function RegistrationEmailResendingPage() {
  const { generalError, setError, clearErrors, field } = useFormErrors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSuccess(false);
    setLoading(true);
    try {
      await authApi.registrationEmailResending(email);
      setSuccess(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="card">
        <h1 className="form-title">Resend confirmation email</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={field('email')}
            required
          />
          {success && (
            <div className="success-banner">
              If the email is registered, a new letter has been sent.
            </div>
          )}
          {generalError && <div className="error-banner">{generalError}</div>}
          <Button type="submit" block disabled={loading}>
            Resend
          </Button>
        </form>
        <p className="form-footer">
          <Link to="/registration-confirmation">Back to confirmation</Link>
        </p>
      </div>
    </div>
  );
}
