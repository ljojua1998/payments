"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { GEORGIAN_MONTHS_SHORT, formatGel } from "@/lib/format";
import {
  useYearlyStats,
  type MonthBar,
} from "@/lib/hooks/use-yearly-stats";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;

function monthsForYear(year: number): number {
  if (year > CURRENT_YEAR) return 0;
  if (year === CURRENT_YEAR) return CURRENT_MONTH;
  return 12;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function MonthColumn({
  bar,
  year,
  max,
}: {
  bar: MonthBar;
  year: number;
  max: number;
}) {
  const total = bar.matchedAmount + bar.unmatchedAmount;
  const matchedPct = (bar.matchedAmount / max) * 100;
  const unmatchedPct = (bar.unmatchedAmount / max) * 100;
  const empty = total === 0;

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
        {bar.matchRate === null ? "" : `${Math.round(bar.matchRate * 100)}%`}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-44 w-full flex-col justify-end gap-[2px]">
            {empty ? (
              <div className="h-1 w-full rounded bg-border" />
            ) : (
              <>
                <div
                  className="w-full rounded-t bg-destructive transition-[height] duration-500"
                  style={{ height: `${unmatchedPct}%` }}
                />
                <div
                  className="w-full rounded-t bg-success transition-[height] duration-500"
                  style={{ height: `${matchedPct}%` }}
                />
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5">
            <p className="font-medium">
              {GEORGIAN_MONTHS_SHORT[bar.monthNumber - 1]} {year}
            </p>
            {empty ? (
              <p className="opacity-80">მონაცემი არ არის</p>
            ) : (
              <>
                <p className="text-success">
                  დამთხვეული: {formatGel(bar.matchedAmount)} ({bar.matchedCount})
                </p>
                <p className="text-red-300">
                  შეუსაბამო: {formatGel(bar.unmatchedAmount)} ({bar.unmatchedCount})
                </p>
                <p className="opacity-80">სულ: {formatGel(total)}</p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      <span className="text-[11px] font-medium text-muted-foreground">
        {GEORGIAN_MONTHS_SHORT[bar.monthNumber - 1]}
      </span>
    </div>
  );
}

function YearTotals({ bars }: { bars: MonthBar[] }) {
  const totals = bars.reduce(
    (acc, bar) => ({
      matched: acc.matched + bar.matchedAmount,
      unmatched: acc.unmatched + bar.unmatchedAmount,
      matchedCount: acc.matchedCount + bar.matchedCount,
      unmatchedCount: acc.unmatchedCount + bar.unmatchedCount,
    }),
    { matched: 0, unmatched: 0, matchedCount: 0, unmatchedCount: 0 },
  );
  const relevant = totals.matchedCount + totals.unmatchedCount;
  const rate = relevant > 0 ? Math.round((totals.matchedCount / relevant) * 100) : null;

  const cards = [
    { label: "დამთხვეული (წელი)", value: formatGel(totals.matched), tone: "text-success" },
    { label: "შეუსაბამო (წელი)", value: formatGel(totals.unmatched), tone: "text-destructive" },
    { label: "საშ. match rate", value: rate === null ? "—" : `${rate}%`, tone: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-[13px] font-medium text-muted-foreground">
            {card.label}
          </p>
          <p className={cn("mt-1.5 text-xl font-semibold tabular-nums", card.tone)}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsView() {
  const statsQuery = useYearlyStats(CURRENT_YEAR);
  const [year, setYear] = useState(CURRENT_YEAR);

  const years = statsQuery.data?.availableYears ?? [CURRENT_YEAR];
  const activeYear = years.includes(year) ? year : years[0];

  const bars = useMemo(() => {
    const map = statsQuery.data?.byMonthKey;
    const count = monthsForYear(activeYear);
    return Array.from({ length: count }, (_, index) => {
      const monthNumber = index + 1;
      const key = `${activeYear}-${String(monthNumber).padStart(2, "0")}`;
      return (
        map?.get(key) ?? {
          monthNumber,
          matchedAmount: 0,
          unmatchedAmount: 0,
          matchedCount: 0,
          unmatchedCount: 0,
          matchRate: null,
        }
      );
    });
  }, [statsQuery.data, activeYear]);

  const max = useMemo(
    () => niceMax(Math.max(0, ...bars.map((b) => b.matchedAmount + b.unmatchedAmount))),
    [bars],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">ანალიტიკა</h1>
          <p className="text-sm text-muted-foreground">
            მატჩინგის დინამიკა თვეების და წლების მიხედვით
          </p>
        </div>
        {years.length > 1 && (
          <div
            role="tablist"
            aria-label="წლის არჩევა"
            className="flex gap-1 rounded-lg border border-border bg-muted p-1"
          >
            {years.map((y) => (
              <button
                key={y}
                role="tab"
                aria-selected={y === activeYear}
                onClick={() => setYear(y)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium tabular-nums transition-colors",
                  y === activeYear
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {statsQuery.isPending ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
        </>
      ) : statsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-12 text-center">
          <p className="text-sm text-destructive">{statsQuery.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => statsQuery.refetch()}>
            თავიდან ცდა
          </Button>
        </div>
      ) : (
        <>
          <YearTotals bars={bars} />

          <section className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
              <div>
                <h2 className="text-base font-semibold">მატჩინგის დინამიკა</h2>
                <p className="text-xs text-muted-foreground">
                  {activeYear} წელი · {bars.length} თვე
                </p>
              </div>
              <div className="flex items-center gap-3 text-[13px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-success" />
                  დამთხვეული
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-destructive" />
                  შეუსაბამო
                </span>
              </div>
            </div>

            <div className="overflow-x-auto px-4 py-5">
              <div
                className={cn(
                  "flex items-end gap-3",
                  bars.length > 6 ? "min-w-[640px]" : "min-w-0",
                )}
              >
                {bars.map((bar) => (
                  <MonthColumn
                    key={bar.monthNumber}
                    bar={bar}
                    year={activeYear}
                    max={max}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
