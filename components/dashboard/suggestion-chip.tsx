"use client";

import { Sparkles } from "lucide-react";
import { useCompanySuggestions } from "@/lib/hooks/use-company-suggestions";
import type { BankTransaction, Company } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SuggestionChipProps = {
  transaction: BankTransaction;
  onAssign: (transaction: BankTransaction, company: Company) => void;
};

export function SuggestionChip({ transaction, onAssign }: SuggestionChipProps) {
  const suggestions = useCompanySuggestions(transaction, true);
  const top = suggestions.data?.[0];

  if (suggestions.isPending) {
    return <span className="block h-6 w-28 animate-pulse rounded-full bg-muted" />;
  }

  if (!top) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() =>
            onAssign(transaction, {
              id: top.company_id,
              name: top.company_name,
              tax_id: top.tax_id,
            })
          }
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <Sparkles size={12} className="shrink-0" />
          <span className="truncate">{top.company_name}</span>
          <span className="shrink-0 tabular-nums opacity-70">
            {Math.round(top.score * 100)}%
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        სახელით მსგავსია ({Math.round(top.score * 100)}%) — დააჭირეთ მისაბმელად
      </TooltipContent>
    </Tooltip>
  );
}
