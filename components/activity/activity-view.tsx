"use client";

import {
  Building2,
  FileSignature,
  FileText,
  KeyRound,
  Link2,
  Upload,
  UserRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useActivity } from "@/lib/hooks/use-activity";
import { usePagination } from "@/lib/hooks/use-pagination";
import type { ActivityRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination";

const ACTION_ICONS: Array<{ prefix: string; icon: LucideIcon; className: string }> = [
  { prefix: "company", icon: Building2, className: "bg-primary/10 text-primary" },
  { prefix: "contract", icon: FileSignature, className: "bg-primary/10 text-primary" },
  { prefix: "import", icon: Upload, className: "bg-success/10 text-success" },
  { prefix: "transaction", icon: Link2, className: "bg-warning/10 text-warning" },
  { prefix: "matching", icon: Wand2, className: "bg-success/10 text-success" },
  { prefix: "document", icon: FileText, className: "bg-primary/10 text-primary" },
  { prefix: "password", icon: KeyRound, className: "bg-muted text-muted-foreground" },
  { prefix: "profile", icon: UserRound, className: "bg-muted text-muted-foreground" },
];

function actionIcon(action: string) {
  return (
    ACTION_ICONS.find((entry) => action.startsWith(entry.prefix)) ?? {
      icon: FileText,
      className: "bg-muted text-muted-foreground",
    }
  );
}

function ActivityRow({ record }: { record: ActivityRecord }) {
  const { icon: Icon, className } = actionIcon(record.action);
  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${className}`}
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <b>{record.user_name}</b> — {record.details}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {formatDateTime(record.created_at)}
        </p>
      </div>
    </li>
  );
}

export function ActivityView() {
  const activityQuery = useActivity();
  const pagination = usePagination(activityQuery.data ?? []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">ისტორია</h1>
        <p className="text-sm text-muted-foreground">
          ვინ რა ცვლილება გააკეთა სისტემაში
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card">
        {activityQuery.isPending ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : activityQuery.isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">
              {activityQuery.error.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => activityQuery.refetch()}
            >
              თავიდან ცდა
            </Button>
          </div>
        ) : activityQuery.data.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            ისტორია ჯერ ცარიელია — გააკეთეთ პირველი ცვლილება
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border/70">
              {pagination.pageItems.map((record) => (
                <ActivityRow key={record.id} record={record} />
              ))}
            </ul>
            {pagination.total > 10 && (
              <div className="border-t border-border px-4 py-3 sm:px-5">
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
      </section>
    </div>
  );
}
