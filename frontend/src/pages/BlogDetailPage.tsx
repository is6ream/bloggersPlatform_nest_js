import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { blogsApi } from '../api/blogs';
import { PostCard } from '../components/PostCard';
import { Pagination } from '../components/ui/Pagination';
import { Spinner } from '../components/ui/Spinner';

export function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);

  const { data: blog, isLoading: blogLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogsApi.getById(id!),
    enabled: !!id,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['blog-posts', id, page],
    queryFn: () => blogsApi.getPosts(id!, { pageNumber: page, pageSize: 10 }),
    enabled: !!id,
  });

  if (blogLoading) return <Spinner className="py-20" />;
  if (!blog) return <p className="py-20 text-center text-gray-500">Блог не найден</p>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/blogs" className="text-sm text-indigo-600 hover:underline">
          ← Все блоги
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{blog.data.name}</h1>
            <p className="mt-2 text-gray-600">{blog.data.description}</p>
            <a
              href={blog.data.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-indigo-500 hover:underline"
            >
              {blog.data.websiteUrl}
            </a>
          </div>
          <time className="shrink-0 text-sm text-gray-400">
            {new Date(blog.data.createdAt).toLocaleDateString('ru-RU')}
          </time>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold text-gray-900">Посты блога</h2>

      {postsLoading ? (
        <Spinner className="py-10" />
      ) : !posts?.data.items.length ? (
        <div className="py-10 text-center text-gray-500">В этом блоге пока нет постов</div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {posts.data.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Pagination
              page={page}
              pagesCount={posts.data.pagesCount}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
