"use client";

import { useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 100] as const;

export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [requestedPage, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return { page, setPage, pageSize, setPageSize, total, pageCount, pageItems };
}
