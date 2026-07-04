import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company, CompanyWithContracts, ContractStatus } from "@/lib/types";
import type { CompanyInput, ContractInput } from "@/lib/schemas/data-entry";

export async function getCompanies(
  supabase: SupabaseClient,
): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, tax_id")
    .order("name");

  if (error) {
    throw new Error(`კომპანიების წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as Company[];
}

export async function getCompaniesWithContracts(
  supabase: SupabaseClient,
): Promise<CompanyWithContracts[]> {
  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, tax_id, contracts(id, company_id, monthly_amount, status, start_date, end_date)",
    )
    .order("name")
    .order("start_date", { referencedTable: "contracts", ascending: false });

  if (error) {
    throw new Error(`კომპანიების წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as CompanyWithContracts[];
}

export async function createCompany(
  supabase: SupabaseClient,
  input: CompanyInput,
): Promise<void> {
  const { error } = await supabase
    .from("companies")
    .insert({ name: input.name, tax_id: input.taxId });

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "ამ ს/კ-ით კომპანია უკვე არსებობს"
        : `კომპანიის დამატება ვერ მოხერხდა: ${error.message}`,
    );
  }
}

export async function createContract(
  supabase: SupabaseClient,
  companyId: string,
  input: ContractInput,
): Promise<void> {
  const { error } = await supabase.from("contracts").insert({
    company_id: companyId,
    monthly_amount: input.monthlyAmount,
    status: input.status,
    start_date: input.startDate,
    end_date: input.endDate ?? null,
  });

  if (error) {
    throw new Error(`ხელშეკრულების დამატება ვერ მოხერხდა: ${error.message}`);
  }
}

export async function updateContractStatus(
  supabase: SupabaseClient,
  contractId: string,
  status: ContractStatus,
  endDate: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("contracts")
    .update({ status, end_date: endDate })
    .eq("id", contractId);

  if (error) {
    throw new Error(`ხელშეკრულების განახლება ვერ მოხერხდა: ${error.message}`);
  }
}
