import { Link } from 'react-router-dom';
import type { Blog } from '../api/types';

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      to={`/blogs/${blog.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {blog.name}
        </h2>
        {blog.isMembership && (
          <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            Premium
          </span>
        )}
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-gray-500">{blog.description}</p>
      <div className="flex items-center justify-between">
        <a
          href={blog.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="truncate text-xs text-indigo-500 hover:underline"
        >
          {blog.websiteUrl}
        </a>
        <time className="shrink-0 text-xs text-gray-400">
          {new Date(blog.createdAt).toLocaleDateString('ru-RU')}
        </time>
      </div>
    </Link>
  );
}
