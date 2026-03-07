import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { securityApi } from '../api/security';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export function SecurityDevicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => securityApi.getDevices(),
    enabled: !!user,
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => securityApi.deleteAllOtherSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  });

  const deleteOneMutation = useMutation({
    mutationFn: (deviceId: string) => securityApi.deleteSession(deviceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  });

  if (authLoading) return <Spinner className="py-20" />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Активные сессии</h1>
          <p className="mt-1 text-sm text-gray-500">Управление устройствами, с которых выполнен вход</p>
        </div>
        {devices && devices.data.length > 1 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteAllMutation.mutate()}
            isLoading={deleteAllMutation.isPending}
          >
            Завершить все остальные
          </Button>
        )}
      </div>

      {isLoading ? (
        <Spinner className="py-10" />
      ) : !devices?.data.length ? (
        <p className="py-10 text-center text-gray-500">Нет активных сессий</p>
      ) : (
        <div className="flex flex-col gap-3">
          {devices.data.map((device, index) => (
            <div
              key={device.deviceId}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                index === 0 ? 'border-indigo-200 ring-1 ring-indigo-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-lg p-2 ${index === 0 ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <svg className={`h-5 w-5 ${index === 0 ? 'text-indigo-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{device.title}</p>
                      {index === 0 && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          Текущая
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">IP: {device.ip}</p>
                    <p className="text-xs text-gray-400">
                      Последняя активность:{' '}
                      {new Date(device.lastActiveDate).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>

                {index !== 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteOneMutation.mutate(device.deviceId)}
                    isLoading={deleteOneMutation.isPending && deleteOneMutation.variables === device.deviceId}
                  >
                    Завершить
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
