"use client";

import { useMemo } from "react";
import { formatGel, formatMonthLabel } from "@/lib/format";
import { useMonthlyStats, type MonthlyStat } from "@/lib/hooks/use-monthly-stats";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const shortMonth = (month: string) => formatMonthLabel(month).split(" ")[0];

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function MonthColumn({ stat, max }: { stat: MonthlyStat; max: number }) {
  const total = stat.matchedAmount + stat.unmatchedAmount;
  const matchedPct = (stat.matchedAmount / max) * 100;
  const unmatchedPct = (stat.unmatchedAmount / max) * 100;

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
        {stat.matchRate === null ? "—" : `${Math.round(stat.matchRate * 100)}%`}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-40 w-full max-w-16 flex-col justify-end gap-[2px]">
            <div
              className="w-full rounded-t bg-destructive transition-[height] duration-500"
              style={{ height: `${unmatchedPct}%` }}
            />
            <div
              className="w-full rounded-t bg-success transition-[height] duration-500"
              style={{ height: `${matchedPct}%` }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5">
            <p className="font-medium">{formatMonthLabel(stat.month)}</p>
            <p className="text-success">
              დამთხვეული: {formatGel(stat.matchedAmount)} ({stat.matchedCount})
            </p>
            <p className="text-red-300">
              შეუსაბამო: {formatGel(stat.unmatchedAmount)} ({stat.unmatchedCount})
            </p>
            <p className="opacity-80">სულ: {formatGel(total)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
      <span className="text-[13px] font-medium">{shortMonth(stat.month)}</span>
    </div>
  );
}

export function MatchRateChart() {
  const statsQuery = useMonthlyStats();

  const max = useMemo(() => {
    const totals = (statsQuery.data ?? []).map(
      (stat) => stat.matchedAmount + stat.unmatchedAmount,
    );
    return niceMax(Math.max(0, ...totals));
  }, [statsQuery.data]);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="text-base font-semibold">მატჩინგის დინამიკა</h2>
          <p className="text-xs text-muted-foreground">
            დამთხვეული vs შეუსაბამო თანხა და match rate თვეების მიხედვით
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

      <div className="px-4 py-5">
        {statsQuery.isPending ? (
          <div className="h-52 animate-pulse rounded-md bg-muted" />
        ) : statsQuery.isError ? (
          <p className="py-14 text-center text-sm text-destructive">
            {statsQuery.error.message}
          </p>
        ) : (
          <div className="flex items-end gap-6 px-2">
            {statsQuery.data.map((stat) => (
              <MonthColumn key={stat.month} stat={stat} max={max} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
