import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blogsApi } from '../api/blogs';
import { BlogCard } from '../components/BlogCard';
import { Pagination } from '../components/ui/Pagination';
import { Spinner } from '../components/ui/Spinner';
import { Input } from '../components/ui/Input';

export function BlogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['blogs', page, search],
    queryFn: () =>
      blogsApi.getAll({ pageNumber: page, pageSize: 9, searchNameTerm: search || undefined }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Блоги</h1>
          {data && (
            <p className="mt-1 text-sm text-gray-500">
              Всего: {data.data.totalCount}
            </p>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Поиск по названию..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Найти
          </button>
        </form>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : !data?.data.items.length ? (
        <div className="py-20 text-center text-gray-500">
          <p className="text-lg">Блоги не найдены</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.items.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Pagination
              page={page}
              pagesCount={data.data.pagesCount}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
