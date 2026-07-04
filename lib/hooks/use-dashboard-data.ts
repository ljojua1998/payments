"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import { getTransactionsByMonth } from "@/lib/services/transactions";
import { getMonthlySummary } from "@/lib/services/summary";
import { getCompanies } from "@/lib/services/companies";
import type { MonthKey } from "@/lib/schemas/dashboard";

export function useTransactions(month: MonthKey) {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: queryKeys.transactions(month),
    queryFn: () => getTransactionsByMonth(supabase, month),
  });
}

export function useMonthlySummary(month: MonthKey) {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: queryKeys.summary(month),
    queryFn: () => getMonthlySummary(supabase, month),
  });
}

export function useCompanies() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: () => getCompanies(supabase),
    staleTime: Infinity,
  });
}
