import { Link } from 'react-router-dom';
import type { Post } from '../api/types';

export function PostCard({ post }: { post: Post }) {
  const { likesCount, dislikesCount, newestLikes } = post.extendedLikesInfo;
  return (
    <Link
      to={`/posts/${post.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="mb-1 text-xs text-indigo-500">{post.blogName}</p>
      <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
        {post.title}
      </h3>
      <p className="mb-3 line-clamp-2 text-sm text-gray-500">{post.shortDescription}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {likesCount}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            {dislikesCount}
          </span>
          {newestLikes.length > 0 && (
            <span className="text-xs text-gray-400">
              Последние: {newestLikes.slice(0, 3).map((l) => l.login).join(', ')}
            </span>
          )}
        </div>
        <time className="text-xs text-gray-400">
          {new Date(post.createdAt).toLocaleDateString('ru-RU')}
        </time>
      </div>
    </Link>
  );
}
