import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company } from "@/lib/types";

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
