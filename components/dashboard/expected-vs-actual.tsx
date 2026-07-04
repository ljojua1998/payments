"use client";

import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGel, formatMonthLabel } from "@/lib/format";
import type { CompanyMonthlySummary } from "@/lib/types";
import type { MonthKey } from "@/lib/schemas/dashboard";
import { Button } from "@/components/ui/button";

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

const TONE_DOT: Record<RowTone, string> = {
  success: "bg-success",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground/50",
};

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
};

export function ExpectedVsActual({
  rows,
  month,
  isLoading,
  error,
  onRetry,
}: ExpectedVsActualProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-display text-lg font-semibold">
            მოსალოდნელი vs ფაქტობრივი
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {formatMonthLabel(month)} — აქტიური ხელშეკრულებების მიხედვით
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={rows.length === 0}
          onClick={() => exportCsv(rows, month)}
        >
          <Download size={15} />
          CSV ექსპორტი
        </Button>
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        {isLoading ? (
          <div className="flex flex-col gap-2 pt-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-md bg-muted"
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
          <div className="overflow-x-auto pt-1">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[13px] text-muted-foreground">
                  <th className="py-2.5 pr-4 font-medium">კომპანია</th>
                  <th className="py-2.5 pr-4 text-right font-medium">
                    მოსალოდნელი
                  </th>
                  <th className="py-2.5 pr-4 text-right font-medium">
                    ფაქტობრივი
                  </th>
                  <th className="py-2.5 text-right font-medium">სხვაობა</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const tone = rowTone(row);
                  const difference = row.actual_amount - row.expected_amount;
                  return (
                    <tr
                      key={row.company_id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              TONE_DOT[tone],
                            )}
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {row.company_name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              ს/კ {row.tax_id}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right tabular-nums">
                        {formatGel(row.expected_amount)}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right tabular-nums">
                        {row.actual_amount === 0
                          ? "—"
                          : formatGel(row.actual_amount)}
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap py-3 text-right font-medium tabular-nums",
                          TONE_TEXT[tone],
                        )}
                      >
                        {difference > 0 ? "+" : ""}
                        {formatGel(difference)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
