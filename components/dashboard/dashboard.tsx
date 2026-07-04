"use client";

import { useMemo } from "react";
import { Search, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardFilters } from "@/lib/hooks/use-dashboard-filters";
import {
  useCompanies,
  useMonthlySummary,
  useTransactions,
} from "@/lib/hooks/use-dashboard-data";
import {
  useRunMatching,
  useTransactionAction,
} from "@/lib/hooks/use-dashboard-mutations";
import type { BankTransaction, Company } from "@/lib/types";
import type { SortField, StatusFilter } from "@/lib/schemas/dashboard";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { StatsBar, computeMonthStats } from "@/components/dashboard/stats-bar";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { ExpectedVsActual } from "@/components/dashboard/expected-vs-actual";

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
  dir: "asc" | "desc",
): BankTransaction[] {
  const normalizedQuery = query.toLowerCase();

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

export function Dashboard() {
  const { filters, setFilters } = useDashboardFilters();
  const transactionsQuery = useTransactions(filters.month);
  const summaryQuery = useMonthlySummary(filters.month);
  const companiesQuery = useCompanies();
  const matching = useRunMatching();
  const transactionAction = useTransactionAction(filters.month);

  const transactions = useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );
  const stats = useMemo(() => computeMonthStats(transactions), [transactions]);
  const visibleTransactions = useMemo(
    () =>
      filterAndSort(
        transactions,
        filters.status,
        filters.q,
        filters.sort,
        filters.dir,
      ),
    [transactions, filters.status, filters.q, filters.sort, filters.dir],
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <MonthSwitcher
          value={filters.month}
          onChange={(month) => setFilters({ month })}
        />
        <div className="flex items-center gap-3">
          {matching.isSuccess && (
            <span className="text-[13px] text-success">
              დაემთხვა {matching.data} ტრანზაქცია
            </span>
          )}
          {matching.isError && (
            <span className="text-[13px] text-destructive">
              მატჩინგი ვერ შესრულდა
            </span>
          )}
          <Button
            onClick={() => matching.mutate()}
            disabled={matching.isPending}
            className="gap-2"
          >
            <Wand2 size={15} />
            {matching.isPending ? "სრულდება..." : "ავტო-მატჩინგი"}
          </Button>
        </div>
      </div>

      <StatsBar stats={stats} isLoading={transactionsQuery.isPending} />

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              ტრანზაქციები
            </h2>
            <label className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={filters.q}
                onChange={(event) => setFilters({ q: event.target.value })}
                placeholder="ძებნა: სახელი ან ს/კ"
                aria-label="ძებნა გამგზავნის სახელით ან საიდენტიფიკაციო კოდით"
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
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

        <div className="px-4 py-4 sm:px-5">
          {transactionsQuery.isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="h-11 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : transactionsQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">
                {transactionsQuery.error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => transactionsQuery.refetch()}
              >
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

      <ExpectedVsActual
        rows={summaryQuery.data ?? []}
        month={filters.month}
        isLoading={summaryQuery.isPending}
        error={summaryQuery.isError ? summaryQuery.error.message : null}
        onRetry={() => summaryQuery.refetch()}
      />
    </div>
  );
}
