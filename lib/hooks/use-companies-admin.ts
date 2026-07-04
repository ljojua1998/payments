"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import {
  createCompany,
  createContract,
  getCompaniesWithContracts,
  updateContractStatus,
} from "@/lib/services/companies";
import { runInnMatching } from "@/lib/services/matching";
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
      return runInnMatching(supabase);
    },
    onSuccess: invalidate,
  });
}

export function useCreateContract() {
  const supabase = useMemo(() => createClient(), []);
  const invalidate = useInvalidateReconciliation();

  return useMutation({
    mutationFn: (variables: { companyId: string; input: ContractInput }) =>
      createContract(supabase, variables.companyId, variables.input),
    onSuccess: invalidate,
  });
}

export function useUpdateContractStatus() {
  const supabase = useMemo(() => createClient(), []);
  const invalidate = useInvalidateReconciliation();

  return useMutation({
    mutationFn: (variables: {
      contractId: string;
      status: ContractStatus;
      endDate: string | null;
    }) =>
      updateContractStatus(
        supabase,
        variables.contractId,
        variables.status,
        variables.endDate,
      ),
    onSuccess: invalidate,
  });
}
