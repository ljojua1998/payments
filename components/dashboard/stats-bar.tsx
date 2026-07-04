import {
  CircleCheck,
  CircleX,
  Percent,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGel } from "@/lib/format";
import type { BankTransaction } from "@/lib/types";

export type MonthStats = {
  totalCount: number;
  totalAmount: number;
  matchedCount: number;
  matchedAmount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  matchRate: number | null;
};

export function computeMonthStats(
  transactions: BankTransaction[],
): MonthStats {
  const stats: MonthStats = {
    totalCount: transactions.length,
    totalAmount: 0,
    matchedCount: 0,
    matchedAmount: 0,
    unmatchedCount: 0,
    unmatchedAmount: 0,
    matchRate: null,
  };

  for (const transaction of transactions) {
    stats.totalAmount += transaction.amount;
    if (transaction.status === "matched") {
      stats.matchedCount += 1;
      stats.matchedAmount += transaction.amount;
    }
    if (transaction.status === "unmatched") {
      stats.unmatchedCount += 1;
      stats.unmatchedAmount += transaction.amount;
    }
  }

  const relevant = stats.matchedCount + stats.unmatchedCount;
  stats.matchRate = relevant > 0 ? stats.matchedCount / relevant : null;

  return stats;
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "success" | "destructive";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            tone === "success"
              ? "bg-success/10 text-success"
              : tone === "destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
          )}
        >
          <Icon size={15} />
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[13px] tabular-nums text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

export function StatsBar({
  stats,
  isLoading,
}: {
  stats: MonthStats;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-[110px] animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="სულ ტრანზაქცია"
        value={String(stats.totalCount)}
        detail={formatGel(stats.totalAmount)}
        icon={ReceiptText}
      />
      <StatCard
        label="დამთხვეული"
        value={String(stats.matchedCount)}
        detail={formatGel(stats.matchedAmount)}
        icon={CircleCheck}
        tone="success"
      />
      <StatCard
        label="შეუსაბამო"
        value={String(stats.unmatchedCount)}
        detail={formatGel(stats.unmatchedAmount)}
        icon={CircleX}
        tone="destructive"
      />
      <StatCard
        label="Match rate"
        value={
          stats.matchRate === null
            ? "—"
            : `${Math.round(stats.matchRate * 100)}%`
        }
        detail={`${stats.matchedCount} / ${stats.matchedCount + stats.unmatchedCount}`}
        icon={Percent}
      />
    </div>
  );
}
