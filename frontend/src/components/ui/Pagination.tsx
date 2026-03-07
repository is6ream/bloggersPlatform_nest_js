interface PaginationProps {
  page: number;
  pagesCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pagesCount, onPageChange }: PaginationProps) {
  if (pagesCount <= 1) return null;

  const pages = Array.from({ length: pagesCount }, (_, i) => i + 1);
  const visible = pages.filter(
    (p) => p === 1 || p === pagesCount || Math.abs(p - page) <= 1,
  );

  const withEllipsis: (number | '...')[] = [];
  visible.forEach((p, i) => {
    if (i > 0 && p - (visible[i - 1] as number) > 1) withEllipsis.push('...');
    withEllipsis.push(p);
  });

  return (
    <nav className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ←
      </button>
      {withEllipsis.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pagesCount}
        className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        →
      </button>
    </nav>
  );
}
