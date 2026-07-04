"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
import { useDashboardFilters } from "@/lib/hooks/use-dashboard-filters";
import {
  useMonthlySummary,
  useTransactions,
} from "@/lib/hooks/use-dashboard-data";
import { useRunMatching } from "@/lib/hooks/use-dashboard-mutations";
import { Button } from "@/components/ui/button";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { StatsBar, computeMonthStats } from "@/components/dashboard/stats-bar";
import { MatchRateChart } from "@/components/dashboard/match-rate-chart";
import { TransactionsSection } from "@/components/dashboard/transactions-section";
import { ExpectedVsActual } from "@/components/dashboard/expected-vs-actual";

const SEARCH_DEBOUNCE_MS = 300;

export function Dashboard() {
  const { filters, setFilters } = useDashboardFilters();
  const transactionsQuery = useTransactions(filters.month);
  const summaryQuery = useMonthlySummary(filters.month);
  const matching = useRunMatching();

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

  const periodTransactions = useMemo(() => {
    const monthRows = transactionsQuery.data ?? [];
    if (!filters.day) return monthRows;
    return monthRows.filter(
      (transaction) => Number(transaction.entry_date.slice(-2)) === filters.day,
    );
  }, [transactionsQuery.data, filters.day]);

  const stats = useMemo(
    () => computeMonthStats(periodTransactions),
    [periodTransactions],
  );

  const visibleSummary = useMemo(() => {
    const rows = summaryQuery.data ?? [];
    const query = searchInput.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.company_name.toLowerCase().includes(query) ||
        row.tax_id.includes(query),
    );
  }, [summaryQuery.data, searchInput]);

  const { isSuccess: matchingDone, reset: resetMatching } = matching;
  useEffect(() => {
    if (!matchingDone) return;
    const timer = setTimeout(resetMatching, 6000);
    return () => clearTimeout(timer);
  }, [matchingDone, resetMatching]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">მიმოხილვა</h1>
          <p className="text-sm text-muted-foreground">
            გადახდების შედარება ხელშეკრულებებთან
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {matching.isSuccess &&
            (matching.data > 0 ? (
              <span className="text-[13px] text-success">
                დაემთხვა {matching.data} ახალი ტრანზაქცია
              </span>
            ) : (
              <span className="text-[13px] text-muted-foreground">
                ახალი დამთხვევა არ არის — ყველაფერი უკვე მიბმულია
              </span>
            ))}
          {matching.isError && (
            <span className="text-[13px] text-destructive">
              მატჩინგი ვერ შესრულდა
            </span>
          )}
          <PeriodPicker
            month={filters.month}
            day={filters.day}
            onChange={(month, day) => setFilters({ month, day })}
          />
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

      <MatchRateChart />

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <TransactionsSection
          transactions={periodTransactions}
          filters={filters}
          setFilters={setFilters}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          isLoading={transactionsQuery.isPending}
          error={
            transactionsQuery.isError ? transactionsQuery.error.message : null
          }
          onRetry={() => transactionsQuery.refetch()}
        />

        <ExpectedVsActual
          rows={visibleSummary}
          month={filters.month}
          highlightActual={searchInput.trim() !== ""}
          isLoading={summaryQuery.isPending}
          error={summaryQuery.isError ? summaryQuery.error.message : null}
          onRetry={() => summaryQuery.refetch()}
        />
      </div>
    </div>
  );
}
