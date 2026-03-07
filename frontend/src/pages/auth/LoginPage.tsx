import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  loginOrEmail: z.string().min(1, 'Введите логин или email'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.loginOrEmail, values.password);
      navigate('/blogs');
    } catch {
      setError('root', { message: 'Неверный логин или пароль' });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Вход</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Логин или Email" {...register('loginOrEmail')} error={errors.loginOrEmail?.message} />
            <Input label="Пароль" type="password" {...register('password')} error={errors.password?.message} />

            {errors.root && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} className="mt-2">
              Войти
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-center text-sm text-gray-600">
            <Link to="/register" className="text-indigo-600 hover:underline">
              Нет аккаунта? Зарегистрироваться
            </Link>
            <Link to="/forgot-password" className="text-indigo-600 hover:underline">
              Забыли пароль?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
