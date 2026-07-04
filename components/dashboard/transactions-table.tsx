"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatGel } from "@/lib/format";
import type { BankTransaction, Company } from "@/lib/types";
import type { SortDirection, SortField } from "@/lib/schemas/dashboard";
import { TruncatedText } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SuggestionChip } from "@/components/dashboard/suggestion-chip";
import { TransactionActions } from "@/components/dashboard/transaction-actions";

type SortState = { sort: SortField; dir: SortDirection };

type TransactionsTableProps = {
  transactions: BankTransaction[];
  companies: Company[];
  sortState: SortState;
  onSortChange: (sort: SortField) => void;
  onAssign: (transaction: BankTransaction, company: Company) => void;
  onUnmatch: (transaction: BankTransaction) => void;
  onIgnore: (transaction: BankTransaction) => void;
  onRestore: (transaction: BankTransaction) => void;
};

function SortButton({
  label,
  field,
  sortState,
  onSortChange,
}: {
  label: string;
  field: SortField;
  sortState: SortState;
  onSortChange: (sort: SortField) => void;
}) {
  const isActive = sortState.sort === field;
  const Icon = !isActive
    ? ArrowUpDown
    : sortState.dir === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      onClick={() => onSortChange(field)}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon size={13} />
    </button>
  );
}

function SenderCell({ transaction }: { transaction: BankTransaction }) {
  return (
    <div className="min-w-0">
      <TruncatedText
        text={transaction.sender_name ?? "უცნობი გამგზავნი"}
        className="font-medium"
      />
      {transaction.purpose && (
        <TruncatedText
          text={transaction.purpose}
          className="max-w-[26ch] text-xs text-muted-foreground sm:max-w-[38ch]"
        />
      )}
    </div>
  );
}

function MatchedCompanyCell({
  transaction,
  onAssign,
}: {
  transaction: BankTransaction;
  onAssign: (transaction: BankTransaction, company: Company) => void;
}) {
  if (!transaction.matched_company) {
    if (transaction.status === "unmatched" && transaction.sender_name) {
      return <SuggestionChip transaction={transaction} onAssign={onAssign} />;
    }
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="min-w-0">
      <TruncatedText text={transaction.matched_company.name} />
      {transaction.match_method && (
        <p className="text-xs text-muted-foreground">
          {transaction.match_method === "manual" ? "ხელით" : "ს/კ ზუსტი"}
          {transaction.match_confidence !== null &&
            ` · ${Number(transaction.match_confidence).toFixed(2)}`}
        </p>
      )}
    </div>
  );
}

export function TransactionsTable({
  transactions,
  companies,
  sortState,
  onSortChange,
  onAssign,
  onUnmatch,
  onIgnore,
  onRestore,
}: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-4 py-12 text-center">
        <p className="font-medium">ტრანზაქციები ვერ მოიძებნა</p>
        <p className="text-sm text-muted-foreground">
          შეცვალეთ ფილტრი ან საძიებო სიტყვა
        </p>
      </div>
    );
  }

  const renderActions = (transaction: BankTransaction) => (
    <TransactionActions
      transaction={transaction}
      companies={companies}
      onAssign={onAssign}
      onUnmatch={onUnmatch}
      onIgnore={onIgnore}
      onRestore={onRestore}
    />
  );

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[13px]">
              <th className="py-2.5 pr-4 font-medium">
                <SortButton
                  label="თარიღი"
                  field="date"
                  sortState={sortState}
                  onSortChange={onSortChange}
                />
              </th>
              <th className="py-2.5 pr-4 font-medium text-muted-foreground">
                გამგზავნი
              </th>
              <th className="py-2.5 pr-4 font-medium text-muted-foreground">
                ს/კ
              </th>
              <th className="py-2.5 pr-4 text-right font-medium">
                <SortButton
                  label="თანხა"
                  field="amount"
                  sortState={sortState}
                  onSortChange={onSortChange}
                />
              </th>
              <th className="py-2.5 pr-4 font-medium text-muted-foreground">
                სტატუსი
              </th>
              <th className="py-2.5 pr-4 font-medium text-muted-foreground">
                კომპანია
              </th>
              <th className="py-2.5 font-medium text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-muted/40",
                  transaction.status === "unmatched" &&
                    "bg-destructive/[0.04] hover:bg-destructive/[0.07]",
                  transaction.status === "ignored" && "opacity-60",
                )}
              >
                <td
                  className={cn(
                    "whitespace-nowrap border-l-[3px] border-l-transparent py-3 pl-2 pr-4 tabular-nums text-muted-foreground",
                    transaction.status === "unmatched" &&
                      "border-l-destructive",
                  )}
                >
                  {formatDate(transaction.entry_date)}
                </td>
                <td className="max-w-0 py-3 pr-4">
                  <SenderCell transaction={transaction} />
                </td>
                <td className="whitespace-nowrap py-3 pr-4 tabular-nums text-muted-foreground">
                  {transaction.sender_inn ?? "—"}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-right font-medium tabular-nums">
                  {formatGel(transaction.amount)}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={transaction.status} />
                </td>
                <td className="max-w-[180px] py-3 pr-4">
                  <MatchedCompanyCell
                    transaction={transaction}
                    onAssign={onAssign}
                  />
                </td>
                <td className="py-3 text-right">{renderActions(transaction)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {transactions.map((transaction) => (
          <li
            key={transaction.id}
            className={cn(
              "rounded-lg border border-border bg-card p-4",
              transaction.status === "unmatched" &&
                "border-destructive/40 bg-destructive/[0.04]",
              transaction.status === "ignored" && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <SenderCell transaction={transaction} />
              {renderActions(transaction)}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold tabular-nums">
                {formatGel(transaction.amount)}
              </span>
              <StatusBadge status={transaction.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-muted-foreground">თარიღი</dt>
              <dd className="text-right tabular-nums">
                {formatDate(transaction.entry_date)}
              </dd>
              <dt className="text-muted-foreground">ს/კ</dt>
              <dd className="text-right tabular-nums">
                {transaction.sender_inn ?? "—"}
              </dd>
              {transaction.matched_company && (
                <>
                  <dt className="text-muted-foreground">კომპანია</dt>
                  <dd className="truncate text-right">
                    {transaction.matched_company.name}
                  </dd>
                </>
              )}
            </dl>
            {transaction.status === "unmatched" && transaction.sender_name && (
              <div className="mt-3">
                <SuggestionChip transaction={transaction} onAssign={onAssign} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
