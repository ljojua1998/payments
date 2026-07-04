"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  dashboardFiltersSchema,
  type DashboardFilters,
} from "@/lib/schemas/dashboard";

export function useDashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () =>
      dashboardFiltersSchema.parse({
        month: searchParams.get("month") ?? undefined,
        status: searchParams.get("status") ?? undefined,
        q: searchParams.get("q") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        dir: searchParams.get("dir") ?? undefined,
      }),
    [searchParams],
  );

  const setFilters = useCallback(
    (updates: Partial<DashboardFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  return { filters, setFilters };
}
