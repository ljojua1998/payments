"use client";

import { useState } from "react";
import { FilePlus2, PauseCircle, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatGel } from "@/lib/format";
import { useCompaniesWithContracts } from "@/lib/hooks/use-companies-admin";
import type { Company, Contract, ContractStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CompanyDialog } from "@/components/companies/company-dialog";
import { ContractDialog } from "@/components/companies/contract-dialog";
import { ContractStatusDialog } from "@/components/companies/contract-status-dialog";

const CONTRACT_STATUS: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  active: {
    label: "აქტიური",
    className: "bg-success/10 text-success border-success/25",
  },
  paused: {
    label: "შეჩერებული",
    className: "bg-warning/10 text-warning border-warning/25",
  },
  ended: {
    label: "დასრულებული",
    className: "bg-muted text-muted-foreground border-border",
  },
};

function ContractRow({
  contract,
  onAction,
}: {
  contract: Contract;
  onAction: (contract: Contract, action: "paused" | "ended") => void;
}) {
  const status = CONTRACT_STATUS[contract.status];

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium tabular-nums">
          {formatGel(contract.monthly_amount)}/თვე
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDate(contract.start_date)}
          {" — "}
          {contract.end_date ? formatDate(contract.end_date) : "უვადო"}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>
      {contract.status === "active" && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={() => onAction(contract, "paused")}
          >
            <PauseCircle size={13} />
            შეჩერება
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => onAction(contract, "ended")}
          >
            <StopCircle size={13} />
            დასრულება
          </Button>
        </div>
      )}
    </li>
  );
}

export function CompaniesView() {
  const companiesQuery = useCompaniesWithContracts();
  const [contractTarget, setContractTarget] = useState<Company | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    contract: Contract;
    action: "paused" | "ended";
  } | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">კომპანიები</h1>
          <p className="text-sm text-muted-foreground">
            კლიენტები და მათი მომსახურების ხელშეკრულებები
          </p>
        </div>
        <CompanyDialog />
      </div>

      {companiesQuery.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : companiesQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-10 text-center">
          <p className="text-sm text-destructive">
            {companiesQuery.error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => companiesQuery.refetch()}
          >
            თავიდან ცდა
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {companiesQuery.data.map((company) => (
            <li
              key={company.id}
              className="rounded-xl border border-border bg-card px-4 py-3.5 sm:px-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{company.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    ს/კ {company.tax_id}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setContractTarget(company)}
                >
                  <FilePlus2 size={14} />
                  ხელშეკრულება
                </Button>
              </div>

              {company.contracts.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  ხელშეკრულება ჯერ არ არის
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border/70">
                  {company.contracts.map((contract) => (
                    <ContractRow
                      key={contract.id}
                      contract={contract}
                      onAction={(target, action) =>
                        setStatusTarget({ contract: target, action })
                      }
                    />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {contractTarget && (
        <ContractDialog
          company={contractTarget}
          open={Boolean(contractTarget)}
          onClose={() => setContractTarget(null)}
        />
      )}
      <ContractStatusDialog
        contract={statusTarget?.contract ?? null}
        action={statusTarget?.action ?? null}
        onClose={() => setStatusTarget(null)}
      />
    </div>
  );
}
