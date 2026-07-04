"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type MonthBar = {
  monthNumber: number;
  matchedAmount: number;
  unmatchedAmount: number;
  matchedCount: number;
  unmatchedCount: number;
  matchRate: number | null;
};

export type YearlyStats = {
  availableYears: number[];
  byMonthKey: Map<string, MonthBar>;
};

type StatRow = { entry_date: string; amount: number; status: string };

const emptyBar = (monthNumber: number): MonthBar => ({
  monthNumber,
  matchedAmount: 0,
  unmatchedAmount: 0,
  matchedCount: 0,
  unmatchedCount: 0,
  matchRate: null,
});

async function getYearlyStats(
  supabase: ReturnType<typeof createClient>,
  currentYear: number,
): Promise<YearlyStats> {
  const { data, error } = await supabase
    .from("bank_transactions")
    .select("entry_date, amount, status");

  if (error) {
    throw new Error(`სტატისტიკის წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }

  const rows = (data ?? []) as StatRow[];
  const byMonthKey = new Map<string, MonthBar>();
  const dataYears: number[] = [];

  for (const row of rows) {
    const key = row.entry_date.slice(0, 7);
    dataYears.push(Number(row.entry_date.slice(0, 4)));

    const bar = byMonthKey.get(key) ?? emptyBar(Number(row.entry_date.slice(5, 7)));
    if (row.status === "matched") {
      bar.matchedAmount += Number(row.amount);
      bar.matchedCount += 1;
    } else if (row.status === "unmatched") {
      bar.unmatchedAmount += Number(row.amount);
      bar.unmatchedCount += 1;
    }
    byMonthKey.set(key, bar);
  }

  for (const bar of byMonthKey.values()) {
    const relevant = bar.matchedCount + bar.unmatchedCount;
    bar.matchRate = relevant > 0 ? bar.matchedCount / relevant : null;
  }

  // ყოველთვის ვთავაზობთ მიმდინარეს + წინა 2 წელს (მინიმუმ), პლუს
  // ნებისმიერ წელს, რომელსაც მონაცემი აქვს — რომ წლების გადართვა ჩანდეს.
  const minYear = Math.min(currentYear - 2, ...dataYears);
  const availableYears: number[] = [];
  for (let year = currentYear; year >= minYear; year -= 1) {
    availableYears.push(year);
  }

  return { availableYears, byMonthKey };
}

export function useYearlyStats(currentYear: number) {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: ["transactions", "yearly-stats"],
    queryFn: () => getYearlyStats(supabase, currentYear),
    staleTime: 30_000,
  });
}
