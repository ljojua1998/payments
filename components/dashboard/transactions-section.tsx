"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanies } from "@/lib/hooks/use-dashboard-data";
import { useTransactionAction } from "@/lib/hooks/use-dashboard-mutations";
import type { BankTransaction, Company } from "@/lib/types";
import type {
  DashboardFilters,
  SortDirection,
  SortField,
  StatusFilter,
} from "@/lib/schemas/dashboard";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "@/components/dashboard/transactions-table";

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "ყველა" },
  { value: "matched", label: "დამთხვეული" },
  { value: "unmatched", label: "შეუსაბამო" },
  { value: "ignored", label: "იგნორირებული" },
];

function filterAndSort(
  transactions: BankTransaction[],
  status: StatusFilter,
  query: string,
  sort: SortField,
  dir: SortDirection,
): BankTransaction[] {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = transactions.filter((transaction) => {
    if (status !== "all" && transaction.status !== status) return false;
    if (!normalizedQuery) return true;
    return [
      transaction.sender_name,
      transaction.sender_inn,
      transaction.matched_company?.name,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery));
  });

  const direction = dir === "asc" ? 1 : -1;
  return filtered.sort((a, b) => {
    if (sort === "amount") return (a.amount - b.amount) * direction;
    return a.entry_date.localeCompare(b.entry_date) * direction;
  });
}

type TransactionsSectionProps = {
  transactions: BankTransaction[];
  filters: DashboardFilters;
  setFilters: (updates: Partial<DashboardFilters>) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function TransactionsSection({
  transactions,
  filters,
  setFilters,
  isLoading,
  error,
  onRetry,
}: TransactionsSectionProps) {
  const companiesQuery = useCompanies();
  const transactionAction = useTransactionAction(filters.month);
  const [searchInput, setSearchInput] = useState(filters.q);
  const lastPushedQuery = useRef(filters.q);

  useEffect(() => {
    if (filters.q !== lastPushedQuery.current) {
      lastPushedQuery.current = filters.q;
      setSearchInput(filters.q);
    }
  }, [filters.q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.q) {
        lastPushedQuery.current = searchInput;
        setFilters({ q: searchInput });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, filters.q, setFilters]);

  const visibleTransactions = useMemo(
    () =>
      filterAndSort(
        transactions,
        filters.status,
        searchInput,
        filters.sort,
        filters.dir,
      ),
    [transactions, filters.status, searchInput, filters.sort, filters.dir],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: transactions.length,
      matched: 0,
      unmatched: 0,
      ignored: 0,
    };
    for (const transaction of transactions) {
      counts[transaction.status] += 1;
    }
    return counts;
  }, [transactions]);

  const handleSortChange = (sort: SortField) => {
    if (filters.sort === sort) {
      setFilters({ dir: filters.dir === "asc" ? "desc" : "asc" });
    } else {
      setFilters({ sort, dir: "desc" });
    }
  };

  const runAction = (action: Parameters<typeof transactionAction.mutate>[0]) =>
    transactionAction.mutate(action);

  return (
    <section className="rounded-xl border border-border bg-card xl:col-span-2">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">ტრანზაქციები</h2>
          <label className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ძებნა: სახელი ან ს/კ"
              aria-label="ძებნა გამგზავნის სახელით ან საიდენტიფიკაციო კოდით"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring sm:text-sm"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilters({ status: tab.value })}
              className={cn(
                "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                filters.status === tab.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span className="ml-1.5 tabular-nums opacity-70">
                {statusCounts[tab.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              თავიდან ცდა
            </Button>
          </div>
        ) : (
          <TransactionsTable
            transactions={visibleTransactions}
            companies={companiesQuery.data ?? []}
            sortState={{ sort: filters.sort, dir: filters.dir }}
            onSortChange={handleSortChange}
            onAssign={(transaction, company: Company) =>
              runAction({ type: "assign", transaction, company })
            }
            onUnmatch={(transaction) =>
              runAction({ type: "unmatch", transaction })
            }
            onIgnore={(transaction) =>
              runAction({ type: "ignore", transaction })
            }
            onRestore={(transaction) =>
              runAction({ type: "restore", transaction })
            }
          />
        )}
      </div>
    </section>
  );
}
