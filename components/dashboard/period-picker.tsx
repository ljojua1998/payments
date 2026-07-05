"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GEORGIAN_MONTHS_SHORT,
  formatMonthLabel,
  getMonthRange,
} from "@/lib/format";
import { type MonthKey } from "@/lib/schemas/dashboard";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const WEEKDAYS = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];
const CURRENT_MONTH_KEY = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
})();

type PeriodPickerProps = {
  month: MonthKey;
  day?: number;
  onChange: (month: MonthKey, day?: number) => void;
};

export function PeriodPicker({ month, day, onChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(month.slice(0, 4)));

  useEffect(() => {
    if (open) setViewYear(Number(month.slice(0, 4)));
  }, [open, month]);

  const daysInMonth = Number(getMonthRange(month).end.slice(-2));
  const firstWeekday = (new Date(`${month}-01T00:00:00`).getDay() + 6) % 7;

  const label = day
    ? `${day} ${formatMonthLabel(month)}`
    : formatMonthLabel(month);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-medium">
          <CalendarDays size={16} className="text-primary" />
          {label}
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[19rem]">
        <div className="flex items-center justify-between px-1 pb-2">
          <button
            onClick={() => setViewYear((y) => y - 1)}
            aria-label="წინა წელი"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide tabular-nums text-muted-foreground">
            თვე · {viewYear}
          </span>
          <button
            onClick={() => setViewYear((y) => y + 1)}
            aria-label="შემდეგი წელი"
            disabled={viewYear >= Number(CURRENT_MONTH_KEY.slice(0, 4))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 12 }, (_, index) => {
            const monthKey = `${viewYear}-${String(index + 1).padStart(2, "0")}`;
            const isFuture = monthKey > CURRENT_MONTH_KEY;
            const isSelected = monthKey === month;
            return (
              <button
                key={monthKey}
                disabled={isFuture}
                onClick={() => onChange(monthKey, undefined)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isFuture
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "hover:bg-muted",
                )}
              >
                {GEORGIAN_MONTHS_SHORT[index]}
              </button>
            );
          })}
        </div>

        <div className="my-3 border-t border-border" />

        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            დღე
          </p>
          <button
            onClick={() => {
              onChange(month, undefined);
              setOpen(false);
            }}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
              day === undefined
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            მთელი თვე
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((weekday) => (
            <span
              key={weekday}
              className="py-1 text-center text-[11px] font-medium text-muted-foreground"
            >
              {weekday}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const dayNumber = index + 1;
            const isSelected = dayNumber === day;
            return (
              <button
                key={dayNumber}
                onClick={() => {
                  onChange(month, dayNumber);
                  setOpen(false);
                }}
                className={cn(
                  "aspect-square rounded-md text-sm tabular-nums transition-colors",
                  isSelected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
