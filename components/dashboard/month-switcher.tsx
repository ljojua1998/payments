"use client";

import { cn } from "@/lib/utils";
import { formatMonthLabel } from "@/lib/format";
import { AVAILABLE_MONTHS, type MonthKey } from "@/lib/schemas/dashboard";

type MonthSwitcherProps = {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
};

export function MonthSwitcher({ value, onChange }: MonthSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="თვის არჩევა"
      className="flex w-full gap-1 rounded-lg border border-border bg-muted p-1 sm:w-auto"
    >
      {AVAILABLE_MONTHS.map((month) => (
        <button
          key={month}
          role="tab"
          aria-selected={month === value}
          onClick={() => onChange(month)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none",
            month === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {formatMonthLabel(month)}
        </button>
      ))}
    </div>
  );
}
