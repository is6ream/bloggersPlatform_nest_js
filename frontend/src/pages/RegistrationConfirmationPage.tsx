import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFormErrors } from '../hooks/useFormErrors';

export function RegistrationConfirmationPage() {
  const navigate = useNavigate();
  const { generalError, setError, clearErrors, field } = useFormErrors();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      await authApi.registrationConfirmation(code);
      navigate('/login');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="card">
        <h1 className="form-title">Registration confirmation</h1>
        <p className="form-footer" style={{ marginBottom: 16 }}>
          Enter the confirmation code from your email
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            label="Confirmation code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={field('code')}
            required
          />
          {generalError && <div className="error-banner">{generalError}</div>}
          <Button type="submit" block disabled={loading}>
            Confirm
          </Button>
        </form>
        <p className="form-footer">
          Didn&apos;t receive email?{' '}
          <Link to="/registration-email-resending">Resend</Link>
        </p>
      </div>
    </div>
  );
}
