import type { BankTransaction, TransactionStatus } from "@/lib/types";
import type { MonthKey } from "@/lib/schemas/dashboard";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  matched: "დამთხვეული",
  unmatched: "შეუსაბამო",
  ignored: "იგნორირებული",
};

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportTransactionsCsv(
  transactions: BankTransaction[],
  month: MonthKey,
) {
  const header = [
    "თარიღი",
    "დოკუმენტი",
    "გამგზავნი",
    "ს/კ",
    "თანხა",
    "ვალუტა",
    "სტატუსი",
    "კომპანია",
    "დანიშნულება",
  ].join(",");

  const lines = transactions.map((transaction) =>
    [
      transaction.entry_date,
      transaction.doc_key,
      csvCell(transaction.sender_name ?? ""),
      transaction.sender_inn ?? "",
      transaction.amount.toFixed(2),
      transaction.currency,
      STATUS_LABEL[transaction.status],
      csvCell(transaction.matched_company?.name ?? ""),
      csvCell(transaction.purpose ?? ""),
    ].join(","),
  );

  const blob = new Blob(["﻿" + [header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transactions-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
