"use client";

import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGel, formatMonthLabel } from "@/lib/format";
import {
  buildSchedule,
  type ScheduleRow,
  type ScheduleStatus,
} from "@/lib/payment-schedule";
import {
  useCompaniesWithContracts,
  useMatchedPayments,
} from "@/lib/hooks/use-companies-admin";
import { usePagination } from "@/lib/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination";

const STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: (row: ScheduleRow) => string; className: string }
> = {
  paid: {
    label: () => "გადახდილია",
    className: "bg-success/10 text-success border-success/25",
  },
  partial: {
    label: () => "ნაწილობრივ გადახდილი",
    className: "bg-warning/10 text-warning border-warning/25",
  },
  upcoming: {
    label: (row) => `${row.daysDiff} დღეში`,
    className: "bg-accent text-accent-foreground border-border",
  },
  due: {
    label: () => "დღეს უწევს",
    className: "bg-warning/10 text-warning border-warning/25",
  },
  overdue: {
    label: (row) => `აგვიანებს ${-row.daysDiff} დღით`,
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
};

const STATUS_FRAME: Record<ScheduleStatus, string> = {
  paid: "border-success/25",
  partial: "border-warning/45 bg-warning/[0.06]",
  upcoming: "border-border",
  due: "border-warning/50 bg-warning/[0.07]",
  overdue: "border-destructive/45 bg-destructive/[0.05]",
};

const STATUS_DAYBOX: Record<ScheduleStatus, string> = {
  paid: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
  upcoming: "bg-primary/10 text-primary",
  due: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
};

export function PaymentSchedule() {
  const companiesQuery = useCompaniesWithContracts();
  const paymentsQuery = useMatchedPayments();

  const rows = useMemo(
    () =>
      buildSchedule(
        companiesQuery.data ?? [],
        paymentsQuery.data ?? [],
        new Date(),
      ),
    [companiesQuery.data, paymentsQuery.data],
  );

  const pagination = usePagination(rows);
  const isLoading = companiesQuery.isPending || paymentsQuery.isPending;
  const error = companiesQuery.error ?? paymentsQuery.error;
  const now = new Date();

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base font-semibold">გადახდების განრიგი</h2>
          <p className="text-xs text-muted-foreground">
            {formatMonthLabel(
              `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            )}
            {" · დღეს "}
            {now.getDate()} რიცხვია · გადახდის დღე ისტორიული გადახდებიდან
            გამოითვლება
          </p>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5">
        {isLoading ? (
          <div className="flex flex-col gap-2.5 py-1">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                companiesQuery.refetch();
                paymentsQuery.refetch();
              }}
            >
              თავიდან ცდა
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            მიმდინარე ხელშეკრულებები არ არის
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {pagination.pageItems.map((row) => {
                const status = STATUS_CONFIG[row.status];
                return (
                  <li
                    key={row.companyId}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-lg border px-3 py-2.5",
                      STATUS_FRAME[row.status],
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg leading-none",
                          STATUS_DAYBOX[row.status],
                        )}
                      >
                        <span className="text-sm font-bold tabular-nums">
                          {row.payDay}
                        </span>
                        <span className="text-[8px]">რიცხვი</span>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {row.companyName}
                        </p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          მოსალოდნელი {formatGel(row.expectedAmount)}
                          {row.paidAmount > 0 &&
                            ` · გადახდილი ${formatGel(row.paidAmount)}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        status.className,
                      )}
                    >
                      {row.status === "upcoming" && <CalendarClock size={12} />}
                      {status.label(row)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {pagination.total > 10 && (
              <div className="border-t border-border pt-3">
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
          </>
        )}
      </div>
    </section>
  );
}
