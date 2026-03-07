import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { postsApi } from '../../api/posts';
import { blogsApi } from '../../api/blogs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import type { Post } from '../../api/types';

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(30, 'Максимум 30 символов'),
  shortDescription: z.string().min(1, 'Обязательное поле').max(100, 'Максимум 100 символов'),
  content: z.string().min(1, 'Обязательное поле').max(1000, 'Максимум 1000 символов'),
  blogId: z.string().min(1, 'Выберите блог'),
});

type FormValues = z.infer<typeof schema>;

function PostForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}) {
  const { data: blogs } = useQuery({
    queryKey: ['blogs-select'],
    queryFn: () => blogsApi.getAll({ pageSize: 100 }),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Блог</label>
        <select
          {...register('blogId')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">Выберите блог...</option>
          {blogs?.data.items.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {errors.blogId && <p className="text-xs text-red-600">{errors.blogId.message}</p>}
      </div>
      <Input label="Заголовок" {...register('title')} error={errors.title?.message} />
      <Input label="Краткое описание" {...register('shortDescription')} error={errors.shortDescription?.message} />
      <Textarea label="Содержание" rows={6} {...register('content')} error={errors.content?.message} />
      <Button type="submit" isLoading={isLoading} className="mt-2">
        Сохранить
      </Button>
    </form>
  );
}

export function AdminPostsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<{ type: 'create' | 'edit'; post?: Post } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts', page],
    queryFn: () => postsApi.getAll({ pageNumber: page, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => postsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setModalState(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) =>
      postsApi.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setModalState(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Посты {data && `(${data.data.totalCount})`}
        </h2>
        <Button size="sm" onClick={() => setModalState({ type: 'create' })}>
          + Добавить пост
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
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Заголовок</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-gray-600 sm:table-cell">Блог</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-gray-600 md:table-cell">Дата</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.items.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{post.title}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{post.blogName}</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                      {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModalState({ type: 'edit', post })}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteMutation.mutate(post.id)}
                          isLoading={deleteMutation.isPending && deleteMutation.variables === post.id}
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
        title={modalState?.type === 'create' ? 'Новый пост' : 'Редактировать пост'}
      >
        <PostForm
          defaultValues={modalState?.post ? {
            title: modalState.post.title,
            shortDescription: modalState.post.shortDescription,
            content: modalState.post.content,
            blogId: modalState.post.blogId,
          } : undefined}
          onSubmit={(values) => {
            if (modalState?.type === 'edit' && modalState.post) {
              updateMutation.mutate({ id: modalState.post.id, values });
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
