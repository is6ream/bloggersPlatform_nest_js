import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { blogsApi } from '../../api/blogs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import type { Blog } from '../../api/types';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(15, 'Максимум 15 символов'),
  description: z.string().min(1, 'Обязательное поле').max(500, 'Максимум 500 символов'),
  websiteUrl: z.string().url('Некорректный URL').max(100),
});

type FormValues = z.infer<typeof schema>;

function BlogForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Название" {...register('name')} error={errors.name?.message} />
      <Textarea label="Описание" {...register('description')} error={errors.description?.message} />
      <Input label="URL сайта" placeholder="https://example.com" {...register('websiteUrl')} error={errors.websiteUrl?.message} />
      <Button type="submit" isLoading={isLoading} className="mt-2">
        Сохранить
      </Button>
    </form>
  );
}

export function AdminBlogsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<{ type: 'create' | 'edit'; blog?: Blog } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs', page],
    queryFn: () => blogsApi.getAll({ pageNumber: page, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => blogsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      setModalState(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) =>
      blogsApi.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      setModalState(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-blogs'] }),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Блоги {data && `(${data.data.totalCount})`}
        </h2>
        <Button size="sm" onClick={() => setModalState({ type: 'create' })}>
          + Добавить блог
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="py-10" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Название</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-gray-600 sm:table-cell">URL</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-gray-600 md:table-cell">Создан</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.items.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{blog.name}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                      <a href={blog.websiteUrl} target="_blank" rel="noopener noreferrer" className="truncate text-indigo-500 hover:underline">
                        {blog.websiteUrl}
                      </a>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                      {new Date(blog.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModalState({ type: 'edit', blog })}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteMutation.mutate(blog.id)}
                          isLoading={deleteMutation.isPending && deleteMutation.variables === blog.id}
                        >
                          Удалить
                        </Button>
                      </div>
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

      <Modal
        isOpen={!!modalState}
        onClose={() => setModalState(null)}
        title={modalState?.type === 'create' ? 'Новый блог' : 'Редактировать блог'}
      >
        <BlogForm
          defaultValues={modalState?.blog ? {
            name: modalState.blog.name,
            description: modalState.blog.description,
            websiteUrl: modalState.blog.websiteUrl,
          } : undefined}
          onSubmit={(values) => {
            if (modalState?.type === 'edit' && modalState.blog) {
              updateMutation.mutate({ id: modalState.blog.id, values });
            } else {
              createMutation.mutate(values);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
