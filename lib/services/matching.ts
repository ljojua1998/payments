import type { SupabaseClient } from "@supabase/supabase-js";

export async function runInnMatching(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase.rpc("match_transactions_by_inn");

  if (error) {
    throw new Error(`მატჩინგი ვერ შესრულდა: ${error.message}`);
  }
  return data as number;
}
