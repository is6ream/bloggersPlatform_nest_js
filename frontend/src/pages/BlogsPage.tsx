import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogsApi } from '../api/blogs';
import { useAuth } from '../app/providers/AuthProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { formatDate } from '../utils/date';
import { getGeneralError } from '../utils/errors';
import type { Blog, Paginated } from '../types/api';
import '../components/ui/ui.css';

export function BlogsPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [data, setData] = useState<Paginated<Blog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await blogsApi.getAll(
        { pageNumber: page, pageSize, searchNameTerm: searchTerm || undefined },
        accessToken,
      );
      setData(result);
    } catch (e) {
      setError(getGeneralError(e));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <h1 className="page-title">Blogs</h1>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchTerm(search);
          setPage(1);
        }}
      >
        <Input
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>
      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading">Loading...</div>}
      {!loading && data && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Website</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((blog) => (
                <tr key={blog.id} onClick={() => navigate(`/blogs/${blog.id}`)}>
                  <td>{blog.name}</td>
                  <td>{blog.description}</td>
                  <td>
                    <a
                      href={blog.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {blog.websiteUrl}
                    </a>
                  </td>
                  <td>{formatDate(blog.createdAt)}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', cursor: 'default' }}>
                    No blogs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            pagesCount={data.pagesCount}
            totalCount={data.totalCount}
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
