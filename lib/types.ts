export type TransactionStatus = "matched" | "unmatched" | "ignored";
export type MatchMethod = "inn_exact" | "manual";
export type ContractStatus = "active" | "paused" | "ended";

export interface Company {
  id: string;
  name: string;
  tax_id: string;
}

export interface Contract {
  id: string;
  company_id: string;
  monthly_amount: number;
  status: ContractStatus;
  start_date: string;
  end_date: string | null;
}

export interface BankTransaction {
  id: string;
  doc_key: string;
  entry_date: string;
  amount: number;
  currency: string;
  sender_name: string | null;
  sender_inn: string | null;
  sender_account: string | null;
  purpose: string | null;
  matched_company_id: string | null;
  match_method: MatchMethod | null;
  match_confidence: number | null;
  status: TransactionStatus;
  matched_company: Pick<Company, "id" | "name"> | null;
}

export interface CompanyMonthlySummary {
  company_id: string;
  company_name: string;
  tax_id: string;
  expected_amount: number;
  actual_amount: number;
}

export type DocumentStatus = "uploaded" | "analyzing" | "analyzed" | "error";

export interface DocumentRecord {
  id: string;
  user_id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  status: DocumentStatus;
  summary: string | null;
  created_at: string;
}
