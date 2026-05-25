import { Button } from './Button';
import './ui.css';

type Props = {
  page: number;
  pageSize: number;
  pagesCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const PAGE_SIZES = [10, 20, 50];

export function Pagination({
  page,
  pageSize,
  pagesCount,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const pages = Array.from({ length: Math.max(pagesCount, 1) }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === pagesCount || Math.abs(p - page) <= 2,
  );

  return (
    <div className="pagination">
      <span className="pagination-info">
        Total: {totalCount} | Page {page} of {Math.max(pagesCount, 1)}
      </span>
      <div className="pagination-controls">
        <label>
          Show{' '}
          <select
            className="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <div className="pagination-pages">
          {visiblePages.map((p, idx) => {
            const prev = visiblePages[idx - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;
            return (
              <span key={p} style={{ display: 'contents' }}>
                {showEllipsis && <span className="page-btn" style={{ border: 'none' }}>...</span>}
                <button
                  type="button"
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              </span>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= pagesCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
