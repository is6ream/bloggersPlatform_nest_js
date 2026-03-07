import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z
  .object({
    newPassword: z.string().min(6, 'Минимум 6 символов').max(20, 'Максимум 20 символов'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function NewPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recoveryCode = searchParams.get('recoveryCode') ?? '';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.newPassword(values.newPassword, recoveryCode);
      navigate('/login');
    } catch {
      setError('root', { message: 'Ссылка недействительна или истекла' });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Новый пароль</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Новый пароль" type="password" {...register('newPassword')} error={errors.newPassword?.message} />
            <Input label="Подтверждение пароля" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />

            {errors.root && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting}>
              Сохранить пароль
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
