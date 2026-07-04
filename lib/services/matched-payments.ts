import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchedPayment } from "@/lib/payment-schedule";

export async function getMatchedPayments(
  supabase: SupabaseClient,
): Promise<MatchedPayment[]> {
  const { data, error } = await supabase
    .from("bank_transactions")
    .select("matched_company_id, entry_date, amount")
    .eq("status", "matched")
    .not("matched_company_id", "is", null);

  if (error) {
    throw new Error(`გადახდების წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as MatchedPayment[];
}
