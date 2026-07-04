import { z } from "zod";

export const AVAILABLE_MONTHS = ["2026-04", "2026-05", "2026-06"] as const;

export type MonthKey = (typeof AVAILABLE_MONTHS)[number];

export const DEFAULT_MONTH: MonthKey = "2026-06";

export const dashboardFiltersSchema = z.object({
  month: z.enum(AVAILABLE_MONTHS).catch(DEFAULT_MONTH),
  day: z.coerce.number().int().min(1).max(31).optional().catch(undefined),
  status: z.enum(["all", "matched", "unmatched", "ignored"]).catch("all"),
  q: z.string().trim().max(100).catch(""),
  sort: z.enum(["date", "amount"]).catch("date"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
});

export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
export type StatusFilter = DashboardFilters["status"];
export type SortField = DashboardFilters["sort"];
export type SortDirection = DashboardFilters["dir"];
