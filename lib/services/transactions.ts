import type { SupabaseClient } from "@supabase/supabase-js";
import type { BankTransaction } from "@/lib/types";
import type { MonthKey } from "@/lib/schemas/dashboard";
import { getMonthRange } from "@/lib/format";

const TRANSACTION_SELECT = "*, matched_company:companies(id, name)";

export async function getTransactionsByMonth(
  supabase: SupabaseClient,
  month: MonthKey,
): Promise<BankTransaction[]> {
  const { start, end } = getMonthRange(month);
  const { data, error } = await supabase
    .from("bank_transactions")
    .select(TRANSACTION_SELECT)
    .gte("entry_date", start)
    .lte("entry_date", end)
    .order("entry_date", { ascending: false })
    .order("doc_key", { ascending: false });

  if (error) {
    throw new Error(`ტრანზაქციების წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as BankTransaction[];
}

export async function assignCompanyToTransaction(
  supabase: SupabaseClient,
  transactionId: string,
  companyId: string,
): Promise<void> {
  const { error } = await supabase
    .from("bank_transactions")
    .update({
      matched_company_id: companyId,
      match_method: "manual",
      match_confidence: 1.0,
      status: "matched",
    })
    .eq("id", transactionId);

  if (error) {
    throw new Error(`კომპანიის მიბმა ვერ მოხერხდა: ${error.message}`);
  }
}

export async function unmatchTransaction(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("bank_transactions")
    .update({
      matched_company_id: null,
      match_method: null,
      match_confidence: null,
      status: "unmatched",
    })
    .eq("id", transactionId);

  if (error) {
    throw new Error(`მიბმის მოხსნა ვერ მოხერხდა: ${error.message}`);
  }
}

export async function ignoreTransaction(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("bank_transactions")
    .update({ status: "ignored" })
    .eq("id", transactionId);

  if (error) {
    throw new Error(`იგნორირება ვერ მოხერხდა: ${error.message}`);
  }
}

export async function restoreTransaction(
  supabase: SupabaseClient,
  transactionId: string,
  hasCompany: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("bank_transactions")
    .update({ status: hasCompany ? "matched" : "unmatched" })
    .eq("id", transactionId);

  if (error) {
    throw new Error(`აღდგენა ვერ მოხერხდა: ${error.message}`);
  }
}
