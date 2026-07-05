"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useAvailableMonths() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: ["transactions", "available-months"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_transactions")
        .select("entry_date");
      if (error) {
        throw new Error(`თვეების წაკითხვა ვერ მოხერხდა: ${error.message}`);
      }
      const months = new Set(
        (data ?? []).map((row) => (row.entry_date as string).slice(0, 7)),
      );
      return [...months].sort();
    },
    staleTime: 60_000,
  });
}
