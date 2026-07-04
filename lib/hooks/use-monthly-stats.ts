"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { AVAILABLE_MONTHS, type MonthKey } from "@/lib/schemas/dashboard";

export type MonthlyStat = {
  month: MonthKey;
  matchedAmount: number;
  unmatchedAmount: number;
  matchedCount: number;
  unmatchedCount: number;
  matchRate: number | null;
};

type StatRow = { entry_date: string; amount: number; status: string };

async function getMonthlyStats(
  supabase: ReturnType<typeof createClient>,
): Promise<MonthlyStat[]> {
  const { data, error } = await supabase
    .from("bank_transactions")
    .select("entry_date, amount, status");

  if (error) {
    throw new Error(`სტატისტიკის წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }

  const rows = (data ?? []) as StatRow[];

  return AVAILABLE_MONTHS.map((month) => {
    const monthRows = rows.filter((row) => row.entry_date.startsWith(month));
    let matchedAmount = 0;
    let unmatchedAmount = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const row of monthRows) {
      if (row.status === "matched") {
        matchedAmount += Number(row.amount);
        matchedCount += 1;
      } else if (row.status === "unmatched") {
        unmatchedAmount += Number(row.amount);
        unmatchedCount += 1;
      }
    }

    const relevant = matchedCount + unmatchedCount;
    return {
      month,
      matchedAmount,
      unmatchedAmount,
      matchedCount,
      unmatchedCount,
      matchRate: relevant > 0 ? matchedCount / relevant : null,
    };
  });
}

export function useMonthlyStats() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: ["transactions", "monthly-stats"],
    queryFn: () => getMonthlyStats(supabase),
    staleTime: 30_000,
  });
}
