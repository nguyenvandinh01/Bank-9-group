import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1 pt-8" aria-label="Phân trang">
      <button
        type="button"
        className="btn-outline px-3"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((value, index) => {
        const previous = pages[index - 1];
        return (
          <span key={value} className="flex items-center gap-1">
            {previous && value - previous > 1 ? <span className="px-1 text-slate-400">…</span> : null}
            <button
              type="button"
              onClick={() => onChange(value)}
              className={
                value === page
                  ? "btn bg-brand-600 px-3.5 text-white"
                  : "btn-outline px-3.5"
              }
              aria-current={value === page ? "page" : undefined}
            >
              {value}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        className="btn-outline px-3"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
