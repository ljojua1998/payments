"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import { runInnMatching } from "@/lib/services/matching";
import {
  assignCompanyToTransaction,
  ignoreTransaction,
  restoreTransaction,
  unmatchTransaction,
} from "@/lib/services/transactions";
import type { BankTransaction, Company } from "@/lib/types";
import type { MonthKey } from "@/lib/schemas/dashboard";

export function useRunMatching() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runInnMatching(supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allTransactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSummaries });
    },
  });
}

type TransactionAction =
  | { type: "assign"; transaction: BankTransaction; company: Company }
  | { type: "unmatch"; transaction: BankTransaction }
  | { type: "ignore"; transaction: BankTransaction }
  | { type: "restore"; transaction: BankTransaction };

function applyAction(
  transaction: BankTransaction,
  action: TransactionAction,
): BankTransaction {
  switch (action.type) {
    case "assign":
      return {
        ...transaction,
        matched_company_id: action.company.id,
        matched_company: { id: action.company.id, name: action.company.name },
        match_method: "manual",
        match_confidence: 1,
        status: "matched",
      };
    case "unmatch":
      return {
        ...transaction,
        matched_company_id: null,
        matched_company: null,
        match_method: null,
        match_confidence: null,
        status: "unmatched",
      };
    case "ignore":
      return { ...transaction, status: "ignored" };
    case "restore":
      return {
        ...transaction,
        status: transaction.matched_company_id ? "matched" : "unmatched",
      };
  }
}

export function useTransactionAction(month: MonthKey) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const transactionsKey = queryKeys.transactions(month);

  return useMutation({
    mutationFn: (action: TransactionAction) => {
      switch (action.type) {
        case "assign":
          return assignCompanyToTransaction(
            supabase,
            action.transaction.id,
            action.company.id,
          );
        case "unmatch":
          return unmatchTransaction(supabase, action.transaction.id);
        case "ignore":
          return ignoreTransaction(supabase, action.transaction.id);
        case "restore":
          return restoreTransaction(
            supabase,
            action.transaction.id,
            Boolean(action.transaction.matched_company_id),
          );
      }
    },
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      const previous =
        queryClient.getQueryData<BankTransaction[]>(transactionsKey);

      queryClient.setQueryData<BankTransaction[]>(transactionsKey, (rows) =>
        rows?.map((row) =>
          row.id === action.transaction.id ? applyAction(row, action) : row,
        ),
      );

      return { previous };
    },
    onError: (_error, _action, context) => {
      if (context?.previous) {
        queryClient.setQueryData(transactionsKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary(month) });
    },
  });
}
