"use client";

import { Building2, MoreHorizontal, RotateCcw, Unlink, XCircle } from "lucide-react";
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="მოქმედებები"
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {transaction.doc_key}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

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
