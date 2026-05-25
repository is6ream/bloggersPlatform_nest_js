import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { blogsApi } from '../api/blogs';
import { useAuth } from '../app/providers/AuthProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { formatDate } from '../utils/date';
import { getGeneralError } from '../utils/errors';
import type { Blog, Paginated, Post } from '../types/api';
import '../components/ui/ui.css';

export function BlogPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [posts, setPosts] = useState<Paginated<Post> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    if (!blogId) return;
    setLoading(true);
    setError(undefined);
    try {
      const [blogData, postsData] = await Promise.all([
        blogsApi.getById(blogId),
        blogsApi.getPosts(
          blogId,
          { pageNumber: page, pageSize, searchPostNameTerm: searchTerm || undefined },
          accessToken,
        ),
      ]);
      setBlog(blogData);
      setPosts(postsData);
    } catch (e) {
      setError(getGeneralError(e));
    } finally {
      setLoading(false);
    }
  }, [blogId, page, pageSize, searchTerm, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <p>
        <Link to="/blogs">&larr; Back to blogs</Link>
      </p>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}
      {blog && (
        <div className="blog-info card">
          <h1 className="page-title">{blog.name}</h1>
          <p>{blog.description}</p>
          <p>
            Website:{' '}
            <a href={blog.websiteUrl} target="_blank" rel="noreferrer">
              {blog.websiteUrl}
            </a>
          </p>
          <p>Created: {formatDate(blog.createdAt)}</p>
        </div>
      )}
      {posts && (
        <>
          <h2>Posts</h2>
          <form
            className="search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchTerm(search);
              setPage(1);
            }}
          >
            <Input
              placeholder="Search by title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit">Search</Button>
          </form>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Short description</th>
                <th>Likes</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {posts.items.map((post) => (
                <tr key={post.id} onClick={() => navigate(`/posts/${post.id}`)}>
                  <td>{post.title}</td>
                  <td>{post.shortDescription}</td>
                  <td>{post.extendedLikesInfo.likesCount}</td>
                  <td>{formatDate(post.createdAt)}</td>
                </tr>
              ))}
              {posts.items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', cursor: 'default' }}>
                    No posts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            page={posts.page}
            pageSize={posts.pageSize}
            pagesCount={posts.pagesCount}
            totalCount={posts.totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
