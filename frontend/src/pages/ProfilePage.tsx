import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { securityApi } from '../api/security';
import { useAuth } from '../app/providers/AuthProvider';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/date';
import { getGeneralError } from '../utils/errors';
import type { DeviceSession } from '../types/api';
import '../components/ui/ui.css';

export function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await securityApi.getDevices();
      setDevices(data);
    } catch (e) {
      setError(getGeneralError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadDevices();
    }
  }, [isAuthenticated, loadDevices]);

  if (isLoading) return <div className="loading page">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleTerminateAll = async () => {
    try {
      await securityApi.deleteAllOther();
      await loadDevices();
    } catch (e) {
      setError(getGeneralError(e));
    }
  };

  const handleTerminate = async (deviceId: string) => {
    try {
      await securityApi.deleteDevice(deviceId);
      await loadDevices();
    } catch (e) {
      setError(getGeneralError(e));
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Profile</h1>
      {user && (
        <div className="card blog-info">
          <p>
            <strong>Login:</strong> {user.login}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>
      )}

      <h2 style={{ marginTop: 'var(--spacing-xl)' }}>Active sessions</h2>
      {error && <div className="error-banner">{error}</div>}
      <div style={{ marginBottom: 16 }}>
        <Button variant="secondary" onClick={handleTerminateAll}>
          Terminate all other sessions
        </Button>
      </div>
      {loading && <div className="loading">Loading devices...</div>}
      {!loading && (
        <table className="data-table devices-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>IP</th>
              <th>Last active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.deviceId} style={{ cursor: 'default' }}>
                <td>{d.title}</td>
                <td>{d.ip}</td>
                <td>{formatDate(d.lastActiveDate)}</td>
                <td>
                  <Button size="sm" variant="ghost" onClick={() => handleTerminate(d.deviceId)}>
                    Terminate
                  </Button>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  No sessions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
