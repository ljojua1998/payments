import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanySuggestion } from "@/lib/types";

export async function runInnMatching(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase.rpc("match_transactions_by_inn");

  if (error) {
    throw new Error(`მატჩინგი ვერ შესრულდა: ${error.message}`);
  }
  return data as number;
}

export async function suggestCompanies(
  supabase: SupabaseClient,
  senderName: string,
): Promise<CompanySuggestion[]> {
  const { data, error } = await supabase.rpc("suggest_companies", {
    sender: senderName,
  });

  if (error) {
    throw new Error(`შეთავაზებების წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as CompanySuggestion[];
}
