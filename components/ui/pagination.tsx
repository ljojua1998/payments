"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@/lib/hooks/use-pagination";

const ELLIPSIS = "…" as const;

function pageNumbers(current: number, count: number): Array<number | "…"> {
  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index + 1);
  }
  const wanted = [
    ...new Set(
      [1, current - 1, current, current + 1, count].filter(
        (value) => value >= 1 && value <= count,
      ),
    ),
  ].sort((a, b) => a - b);

  const result: Array<number | "…"> = [];
  for (const [index, value] of wanted.entries()) {
    if (index > 0) {
      const previous = wanted[index - 1];
      if (value - previous === 2) result.push(previous + 1);
      else if (value - previous > 2) result.push(ELLIPSIS);
    }
    result.push(value);
  }
  return result;
}

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function PaginationControls({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  if (total <= PAGE_SIZE_OPTIONS[0]) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px]">
      <label className="flex items-center gap-2 text-muted-foreground">
        გვერდზე:
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="ჩანაწერების რაოდენობა გვერდზე"
          className="h-8 rounded-md border border-input bg-card px-2 text-[13px] text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="tabular-nums">
          {rangeStart}–{rangeEnd} / {total}
        </span>
      </label>

      <nav aria-label="გვერდები" className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="წინა გვერდი"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
        {pageNumbers(page, pageCount).map((value, index) =>
          value === ELLIPSIS ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-muted-foreground"
            >
              {ELLIPSIS}
            </span>
          ) : (
            <button
              key={value}
              onClick={() => onPageChange(value)}
              aria-current={value === page ? "page" : undefined}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-md border px-1.5 tabular-nums transition-colors",
                value === page
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="შემდეგი გვერდი"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </nav>
    </div>
  );
}
