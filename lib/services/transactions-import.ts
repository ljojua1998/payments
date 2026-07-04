import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionRowInput } from "@/lib/schemas/data-entry";
import { runInnMatching } from "@/lib/services/matching";

export type ImportResult = {
  inserted: number;
  skipped: number;
  matched: number;
};

const CHUNK_SIZE = 500;

export async function importTransactions(
  supabase: SupabaseClient,
  rows: TransactionRowInput[],
): Promise<ImportResult> {
  let inserted = 0;

  for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("bank_transactions")
      .upsert(chunk, { onConflict: "doc_key", ignoreDuplicates: true })
      .select("id");

    if (error) {
      throw new Error(`იმპორტი ვერ შესრულდა: ${error.message}`);
    }
    inserted += data?.length ?? 0;
  }

  const matched = await runInnMatching(supabase);

  return { inserted, skipped: rows.length - inserted, matched };
}
