import { z } from "zod";

// დეშბორდის თვის ფორმატი: YYYY-MM. მონაცემები დინამიურია — ნებისმიერი
// თვე მუშაობს (იმპორტით დამატებული ივლისი, აგვისტო და ა.შ.).
export const DEFAULT_MONTH = "2026-06";

export type MonthKey = string;

export const dashboardFiltersSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .catch(DEFAULT_MONTH),
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
