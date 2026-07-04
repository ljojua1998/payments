"use client";

import { Download, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGel, formatMonthLabel } from "@/lib/format";
import type { CompanyMonthlySummary } from "@/lib/types";
import type { MonthKey } from "@/lib/schemas/dashboard";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TruncatedText } from "@/components/ui/tooltip";
import { usePagination } from "@/lib/hooks/use-pagination";

type RowTone = "success" | "destructive" | "muted";

function rowTone(row: CompanyMonthlySummary): RowTone {
  if (row.actual_amount === 0) return "muted";
  return row.actual_amount >= row.expected_amount ? "success" : "destructive";
}

const TONE_TEXT: Record<RowTone, string> = {
  success: "text-success",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

const TONE_BAR: Record<RowTone, string> = {
  success: "bg-success",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground/40",
};

const TONE_FRAME: Record<RowTone, string> = {
  success: "border-success/25",
  destructive: "border-destructive/45 bg-destructive/[0.05]",
  muted: "border-dashed border-muted-foreground/40 bg-muted/40",
};

const TONE_CHIP: Record<RowTone, string> = {
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

function paidPercent(row: CompanyMonthlySummary): number {
  if (row.expected_amount === 0) return row.actual_amount > 0 ? 100 : 0;
  return Math.round((row.actual_amount / row.expected_amount) * 100);
}

function fillRatio(row: CompanyMonthlySummary): number {
  if (row.expected_amount === 0) return row.actual_amount > 0 ? 1 : 0;
  return Math.min(row.actual_amount / row.expected_amount, 1);
}

function exportCsv(rows: CompanyMonthlySummary[], month: MonthKey) {
  const header = "კომპანია,ს/კ,მოსალოდნელი,ფაქტობრივი,სხვაობა";
  const lines = rows.map((row) =>
    [
      `"${row.company_name.replace(/"/g, '""')}"`,
      row.tax_id,
      row.expected_amount.toFixed(2),
      row.actual_amount.toFixed(2),
      (row.actual_amount - row.expected_amount).toFixed(2),
    ].join(","),
  );
  const blob = new Blob(["﻿" + [header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expected-vs-actual-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

type ExpectedVsActualProps = {
  rows: CompanyMonthlySummary[];
  month: MonthKey;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  highlightActual?: boolean;
};

export function ExpectedVsActual({
  rows,
  month,
  isLoading,
  error,
  onRetry,
  highlightActual = false,
}: ExpectedVsActualProps) {
  const pagination = usePagination(rows);

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold">
              მოსალოდნელი vs ფაქტობრივი
            </h2>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="როგორ ითვლება"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Info size={15} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-[13px] leading-relaxed">
                <p className="mb-2">
                  <b className="text-foreground">მოსალოდნელი</b> — ამ თვეში{" "}
                  <b className="text-foreground">აქტიური ხელშეკრულებების</b>{" "}
                  ყოველთვიური თანხების ჯამი (იმართება კომპანიების გვერდზე).
                </p>
                <p className="mb-2">
                  <b className="text-foreground">ფაქტობრივი</b> — ამ თვის{" "}
                  <b className="text-foreground">მიბმული</b> საბანკო
                  გადარიცხვების ჯამი. მიუბმელი (შეუსაბამო) გადარიცხვა აქ არ
                  ითვლება, სანამ ავტომატურად ან ხელით არ მიება კომპანიას.
                </p>
                <p className="text-muted-foreground">
                  კომპანია სიაში ჩანს, თუ ამ თვეში ერთი მაინც ნულზე მეტია —
                  მოსალოდნელი ან ფაქტობრივი.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {formatMonthLabel(month)} · აქტიური ხელშეკრულებები
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={rows.length === 0}
          onClick={() => exportCsv(rows, month)}
        >
          <Download size={14} />
          CSV
        </Button>
      </div>

      <div className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-md bg-muted"
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
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            ჩანაწერები ვერ მოიძებნა
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pagination.pageItems.map((row) => {
              const tone = rowTone(row);
              const difference = row.actual_amount - row.expected_amount;
              return (
                <li
                  key={row.company_id}
                  className={cn(
                    "rounded-lg border px-3 py-2.5",
                    TONE_FRAME[tone],
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <TruncatedText
                      text={row.company_name}
                      className="min-w-0 text-sm font-medium"
                    />
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                        TONE_CHIP[tone],
                      )}
                    >
                      {difference > 0 ? "+" : ""}
                      {formatGel(difference)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(fillRatio(row) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.company_name} — გადახდილია ${Math.round(fillRatio(row) * 100)}%`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-300",
                        TONE_BAR[tone],
                      )}
                      style={{ width: `${fillRatio(row) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs tabular-nums">
                    <p className="text-muted-foreground">
                      ფაქტ.{" "}
                      <span
                        className={cn(
                          highlightActual &&
                            row.actual_amount > 0 &&
                            "rounded bg-primary/10 px-1 font-semibold text-primary",
                        )}
                      >
                        {row.actual_amount === 0
                          ? "—"
                          : formatGel(row.actual_amount)}
                      </span>
                      {" · "}მოსალ. {formatGel(row.expected_amount)}
                    </p>
                    <span className={cn("font-semibold", TONE_TEXT[tone])}>
                      {paidPercent(row)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!isLoading && !error && pagination.total > 10 && (
          <div className="pt-2">
            <PaginationControls
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </div>
    </section>
  );
}
