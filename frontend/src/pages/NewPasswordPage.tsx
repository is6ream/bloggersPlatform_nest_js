import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFormErrors } from '../hooks/useFormErrors';

export function NewPasswordPage() {
  const navigate = useNavigate();
  const { generalError, setError, clearErrors, field } = useFormErrors();
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      await authApi.newPassword(recoveryCode, newPassword);
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
        <h1 className="form-title">New password</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="Recovery code"
            name="recoveryCode"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            error={field('recoveryCode')}
            required
          />
          <Input
            label="New password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={field('newPassword')}
            required
          />
          {generalError && <div className="error-banner">{generalError}</div>}
          <Button type="submit" block disabled={loading}>
            Set new password
          </Button>
        </form>
        <p className="form-footer">
          <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
