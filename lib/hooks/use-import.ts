"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import { importTransactions } from "@/lib/services/transactions-import";
import { logActivity } from "@/lib/services/activity";
import type { TransactionRowInput } from "@/lib/schemas/data-entry";

export function useImportTransactions() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: TransactionRowInput[]) => {
      const result = await importTransactions(supabase, rows);
      await logActivity(
        supabase,
        "import_completed",
        `დაამატა ${result.inserted} ტრანზაქცია იმპორტით (გამოტოვდა ${result.skipped}, დაემთხვა ${result.matched})`,
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allTransactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSummaries });
    },
  });
}
