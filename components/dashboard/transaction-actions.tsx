"use client";

import { useState } from "react";
import {
  Building2,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  Unlink,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanySuggestions } from "@/lib/hooks/use-company-suggestions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BankTransaction, Company } from "@/lib/types";

type TransactionActionsProps = {
  transaction: BankTransaction;
  companies: Company[];
  onAssign: (transaction: BankTransaction, company: Company) => void;
  onUnmatch: (transaction: BankTransaction) => void;
  onIgnore: (transaction: BankTransaction) => void;
  onRestore: (transaction: BankTransaction) => void;
};

export function TransactionActions({
  transaction,
  companies,
  onAssign,
  onUnmatch,
  onIgnore,
  onRestore,
}: TransactionActionsProps) {
  const [open, setOpen] = useState(false);
  const suggestions = useCompanySuggestions(transaction, open);
  const showSuggestions =
    transaction.status === "unmatched" && Boolean(transaction.sender_name);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="მოქმედებები"
          className={cn(
            "h-8 w-8",
            transaction.status === "unmatched" &&
              "border border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {transaction.doc_key}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {showSuggestions && (
          <>
            <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-primary">
              <Sparkles size={12} />
              შესაძლო დამთხვევა
            </DropdownMenuLabel>
            {suggestions.isPending ? (
              <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                იძებნება...
              </DropdownMenuItem>
            ) : suggestions.isError || suggestions.data.length === 0 ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                მსგავსი სახელი ვერ მოიძებნა
              </DropdownMenuItem>
            ) : (
              suggestions.data.map((suggestion) => (
                <DropdownMenuItem
                  key={suggestion.company_id}
                  onClick={() =>
                    onAssign(transaction, {
                      id: suggestion.company_id,
                      name: suggestion.company_name,
                      tax_id: suggestion.tax_id,
                    })
                  }
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex flex-col">
                      <span>{suggestion.company_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ს/კ {suggestion.tax_id}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                      {Math.round(suggestion.score * 100)}%
                    </span>
                  </span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {transaction.status !== "ignored" && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Building2 size={15} />
              {transaction.status === "matched"
                ? "კომპანიის შეცვლა"
                : "კომპანიის მიბმა"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-72 w-60 overflow-y-auto">
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  disabled={company.id === transaction.matched_company_id}
                  onClick={() => onAssign(transaction, company)}
                >
                  <span className="flex flex-col">
                    <span>{company.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ს/კ {company.tax_id}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {transaction.status === "matched" && (
          <DropdownMenuItem
            className="gap-2"
            onClick={() => onUnmatch(transaction)}
          >
            <Unlink size={15} />
            მიბმის მოხსნა
          </DropdownMenuItem>
        )}

        {transaction.status !== "ignored" ? (
          <DropdownMenuItem
            className="gap-2 text-muted-foreground"
            onClick={() => onIgnore(transaction)}
          >
            <XCircle size={15} />
            იგნორირება
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="gap-2"
            onClick={() => onRestore(transaction)}
          >
            <RotateCcw size={15} />
            აღდგენა
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
