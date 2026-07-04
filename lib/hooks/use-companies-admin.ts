"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import {
  createCompany,
  createContract,
  deleteCompany,
  getCompaniesWithContracts,
  updateContractStatus,
} from "@/lib/services/companies";
import { getMatchedPayments } from "@/lib/services/matched-payments";
import { runInnMatching } from "@/lib/services/matching";
import { logActivity } from "@/lib/services/activity";
import type { ContractStatus } from "@/lib/types";
import type { CompanyInput, ContractInput } from "@/lib/schemas/data-entry";

const companiesAdminKey = ["companies", "with-contracts"] as const;

export function useCompaniesWithContracts() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: companiesAdminKey,
    queryFn: () => getCompaniesWithContracts(supabase),
  });
}

function useInvalidateReconciliation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: companiesAdminKey });
    queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    queryClient.invalidateQueries({ queryKey: queryKeys.allTransactions });
    queryClient.invalidateQueries({ queryKey: queryKeys.allSummaries });
  };
}

export function useCreateCompany() {
  const supabase = useMemo(() => createClient(), []);
  const invalidate = useInvalidateReconciliation();

  return useMutation({
    mutationFn: async (input: CompanyInput) => {
      await createCompany(supabase, input);
      const matched = await runInnMatching(supabase);
      await logActivity(
        supabase,
        "company_created",
        `დაამატა კომპანია „${input.name}" (ს/კ ${input.taxId})${matched > 0 ? ` — ავტომატურად მიება ${matched} გადარიცხვა` : ""}`,
      );
      return matched;
    },
    onSuccess: invalidate,
  });
}

export function useMatchedPayments() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: ["payments", "matched"],
    queryFn: () => getMatchedPayments(supabase),
  });
}

export function useDeleteCompany() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const invalidate = useInvalidateReconciliation();

  return useMutation({
    mutationFn: async (variables: { id: string; name: string }) => {
      await deleteCompany(supabase, variables.id);
      await logActivity(
        supabase,
        "company_deleted",
        `წაშალა კომპანია „${variables.name}"`,
      );
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["payments", "matched"] });
    },
  });
}

export function useCreateContract() {
  const supabase = useMemo(() => createClient(), []);
  const invalidate = useInvalidateReconciliation();

  return useMutation({
    mutationFn: async (variables: {
      companyId: string;
      companyName: string;
      input: ContractInput;
    }) => {
      await createContract(supabase, variables.companyId, variables.input);
      await logActivity(
        supabase,
        "contract_created",
        `დაამატა ხელშეკრულება: „${variables.companyName}" — ${variables.input.monthlyAmount}₾/თვე`,
      );
    },
    onSuccess: invalidate,
  });
}

export function useUpdateContractStatus() {
  const supabase = useMemo(() => createClient(), []);
  const invalidate = useInvalidateReconciliation();

  return useMutation({
    mutationFn: async (variables: {
      contractId: string;
      status: ContractStatus;
      endDate: string | null;
      monthlyAmount: number;
    }) => {
      await updateContractStatus(
        supabase,
        variables.contractId,
        variables.status,
        variables.endDate,
      );
      await logActivity(
        supabase,
        "contract_status_changed",
        `${variables.status === "paused" ? "შეაჩერა" : "დაასრულა"} ხელშეკრულება (${variables.monthlyAmount}₾/თვე) — ${variables.endDate}`,
      );
    },
    onSuccess: invalidate,
  });
}
