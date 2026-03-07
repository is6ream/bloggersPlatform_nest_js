import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      return;
    }
    authApi
      .confirmRegistration(code)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [code]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        {status === 'loading' && (
          <>
            <Spinner className="mb-4" />
            <p className="text-gray-600">Подтверждение email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Email подтверждён!</h2>
            <p className="mb-6 text-gray-500">Теперь вы можете войти в систему.</p>
            <Button onClick={() => navigate('/login')}>Войти</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Ссылка недействительна</h2>
            <p className="mb-6 text-gray-500">Код подтверждения истёк или уже был использован.</p>
            <Button onClick={() => navigate('/login')}>На главную</Button>
          </>
        )}
      </div>
    </div>
  );
}
