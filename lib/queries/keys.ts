import type { MonthKey } from "@/lib/schemas/dashboard";

export const queryKeys = {
  allTransactions: ["transactions"] as const,
  transactions: (month: MonthKey) => ["transactions", month] as const,
  allSummaries: ["summary"] as const,
  summary: (month: MonthKey) => ["summary", month] as const,
  companies: ["companies"] as const,
};
