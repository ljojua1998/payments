import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  matched: {
    label: "დამთხვეული",
    className: "bg-success/10 text-success border-success/25",
  },
  unmatched: {
    label: "შეუსაბამო",
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
  ignored: {
    label: "იგნორირებული",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
