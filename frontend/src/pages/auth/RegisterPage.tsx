import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';

const schema = z
  .object({
    login: z.string().min(3, 'Минимум 3 символа').max(10, 'Максимум 10 символов').regex(/^[a-zA-Z0-9_-]*$/, 'Только латинские буквы, цифры, _ и -'),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Минимум 6 символов').max(20, 'Максимум 20 символов'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.register(values.login, values.password, values.email);
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errorsMessages?: { message: string; field: string }[] } } };
      const messages = axiosErr?.response?.data?.errorsMessages;
      if (messages) {
        messages.forEach(({ field, message }) => {
          setError(field as keyof FormValues, { message });
        });
      } else {
        setError('root', { message: 'Ошибка регистрации' });
      }
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Проверьте почту</h2>
          <p className="mb-6 text-gray-500">
            Письмо с подтверждением отправлено на ваш email.
          </p>
          <Button onClick={() => navigate('/login')}>Войти</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Регистрация</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Логин" placeholder="my_login" {...register('login')} error={errors.login?.message} />
            <Input label="Email" type="email" placeholder="email@example.com" {...register('email')} error={errors.email?.message} />
            <Input label="Пароль" type="password" {...register('password')} error={errors.password?.message} />
            <Input label="Подтверждение пароля" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />

            {errors.root && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} className="mt-2">
              Зарегистрироваться
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
