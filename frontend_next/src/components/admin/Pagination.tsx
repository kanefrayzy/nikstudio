"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  className?: string;
}

export default function Pagination({
  pagination,
  onPageChange,
  onPerPageChange,
  className = ""
}: PaginationProps) {
  const {
    current_page,
    last_page,
    per_page,
    total,
    from,
    to,
    has_more_pages
  } = pagination;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (last_page <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= last_page; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (current_page > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, current_page - 1);
      const end = Math.min(last_page - 1, current_page + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current_page < last_page - 3) {
        pages.push('...');
      }
      
      // Show last page
      if (last_page > 1) {
        pages.push(last_page);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Results info */}
      <div className="text-sm text-gray-400">
        {from && to ? (
          <>Показано {from}-{to} из {total} записей</>
        ) : (
          <>Всего записей: {total}</>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Per page selector */}
        {onPerPageChange && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-400">На странице:</span>
            <select
              value={per_page}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        {/* Previous button */}
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
          className="flex items-center justify-center w-8 h-8 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
              disabled={typeof page === 'string'}
              className={`
                flex items-center justify-center w-8 h-8 text-sm border rounded
                ${current_page === page
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : typeof page === 'string'
                  ? 'border-transparent text-gray-400 cursor-default'
                  : 'border-gray-600 hover:bg-gray-700'
                }
              `}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={!has_more_pages}
          className="flex items-center justify-center w-8 h-8 text-sm border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}