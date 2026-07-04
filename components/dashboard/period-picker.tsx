"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GEORGIAN_MONTHS_SHORT,
  formatMonthLabel,
  getMonthRange,
} from "@/lib/format";
import { AVAILABLE_MONTHS, type MonthKey } from "@/lib/schemas/dashboard";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const YEAR = 2026;
const WEEKDAYS = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

type PeriodPickerProps = {
  month: MonthKey;
  day?: number;
  onChange: (month: MonthKey, day?: number) => void;
};

export function PeriodPicker({ month, day, onChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);

  const daysInMonth = Number(getMonthRange(month).end.slice(-2));
  const firstWeekday =
    (new Date(`${month}-01T00:00:00`).getDay() + 6) % 7;

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
        <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          თვე · {YEAR}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 12 }, (_, index) => {
            const monthKey = `${YEAR}-${String(index + 1).padStart(2, "0")}`;
            const isAvailable = (
              AVAILABLE_MONTHS as readonly string[]
            ).includes(monthKey);
            const isSelected = monthKey === month;
            return (
              <button
                key={monthKey}
                disabled={!isAvailable}
                onClick={() => onChange(monthKey as MonthKey, undefined)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isAvailable
                      ? "hover:bg-muted"
                      : "cursor-not-allowed text-muted-foreground/40",
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
