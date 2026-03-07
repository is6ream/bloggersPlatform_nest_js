import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '../../api/users';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';

const schema = z.object({
  login: z.string().min(3).max(10).regex(/^[a-zA-Z0-9_-]*$/, 'Только латиница, цифры, _ и -'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6).max(20),
});

type FormValues = z.infer<typeof schema>;

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchLogin, setSearchLogin] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchLogin, searchEmail],
    queryFn: () =>
      usersApi.getAll({
        pageNumber: page,
        pageSize: 10,
        searchLoginTerm: searchLogin || undefined,
        searchEmailTerm: searchEmail || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => usersApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    await createMutation.mutateAsync(values);
    reset();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Пользователи {data && `(${data.data.totalCount})`}
        </h2>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          + Добавить пользователя
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Поиск по логину..."
          value={searchLogin}
          onChange={(e) => { setSearchLogin(e.target.value); setPage(1); }}
          className="flex-1"
        />
        <Input
          placeholder="Поиск по email..."
          value={searchEmail}
          onChange={(e) => { setSearchEmail(e.target.value); setPage(1); }}
          className="flex-1"
        />
      </div>

      {isLoading ? (
        <Spinner className="py-10" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Логин</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-gray-600 sm:table-cell">Email</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-gray-600 md:table-cell">Зарегистрирован</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.items.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.login}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{user.email}</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMutation.mutate(user.id)}
                        isLoading={deleteMutation.isPending && deleteMutation.variables === user.id}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <Pagination page={page} pagesCount={data?.data.pagesCount ?? 1} onPageChange={setPage} />
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новый пользователь">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Логин" {...register('login')} error={errors.login?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Пароль" type="password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            Создать
          </Button>
        </form>
      </Modal>
    </div>
  );
}
