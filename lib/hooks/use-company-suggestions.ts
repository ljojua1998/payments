"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { suggestCompanies } from "@/lib/services/matching";
import type { BankTransaction } from "@/lib/types";

export function useCompanySuggestions(
  transaction: BankTransaction,
  enabled: boolean,
) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["suggestions", transaction.sender_name],
    queryFn: () => suggestCompanies(supabase, transaction.sender_name ?? ""),
    enabled:
      enabled &&
      transaction.status === "unmatched" &&
      Boolean(transaction.sender_name),
    staleTime: 5 * 60_000,
  });
}
