import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyMonthlySummary } from "@/lib/types";
import type { MonthKey } from "@/lib/schemas/dashboard";

export async function getMonthlySummary(
  supabase: SupabaseClient,
  month: MonthKey,
): Promise<CompanyMonthlySummary[]> {
  const { data, error } = await supabase.rpc("monthly_company_summary", {
    target_month: `${month}-01`,
  });

  if (error) {
    throw new Error(`შეჯამების წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as CompanyMonthlySummary[];
}
