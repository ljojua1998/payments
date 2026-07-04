"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import { importTransactions } from "@/lib/services/transactions-import";
import type { TransactionRowInput } from "@/lib/schemas/data-entry";

export function useImportTransactions() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows: TransactionRowInput[]) =>
      importTransactions(supabase, rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allTransactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSummaries });
    },
  });
}
