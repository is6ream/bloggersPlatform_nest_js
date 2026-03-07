import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Некорректный email'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await authApi.passwordRecovery(values.email);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Письмо отправлено</h2>
          <p className="mb-6 text-gray-500">Проверьте почту и перейдите по ссылке для сброса пароля.</p>
          <Link to="/login" className="text-indigo-600 hover:underline text-sm">Вернуться ко входу</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Восстановление пароля</h1>
          <p className="mb-6 text-sm text-gray-500">Введите email, и мы отправим ссылку для сброса пароля.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Button type="submit" isLoading={isSubmitting}>
              Отправить
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            <Link to="/login" className="text-indigo-600 hover:underline">Вернуться ко входу</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
