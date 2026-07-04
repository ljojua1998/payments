"use client";

import { useMemo, useState } from "react";
import { CalendarClock, FilePlus2, PauseCircle, StopCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatGel } from "@/lib/format";
import { companyPayDay, groupPaymentsByCompany } from "@/lib/payment-schedule";
import {
  useCompaniesWithContracts,
  useDeleteCompany,
  useMatchedPayments,
} from "@/lib/hooks/use-companies-admin";
import { usePagination } from "@/lib/hooks/use-pagination";
import type { Company, CompanyWithContracts, Contract, ContractStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination";
import { CompanyDialog } from "@/components/companies/company-dialog";
import { ContractDialog } from "@/components/companies/contract-dialog";
import { ContractStatusDialog } from "@/components/companies/contract-status-dialog";
import { PaymentSchedule } from "@/components/companies/payment-schedule";

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

type StatusFilter = "all" | ContractStatus;
type SortMode = "payday" | "name";

const FILTER_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "ყველა" },
  { value: "active", label: "აქტიური" },
  { value: "paused", label: "შეჩერებული" },
  { value: "ended", label: "დასრულებული" },
];

function companyStatus(company: CompanyWithContracts): ContractStatus | "none" {
  if (company.contracts.some((c) => c.status === "active")) return "active";
  if (company.contracts.some((c) => c.status === "paused")) return "paused";
  if (company.contracts.some((c) => c.status === "ended")) return "ended";
  return "none";
}

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
  const paymentsQuery = useMatchedPayments();
  const deleteCompany = useDeleteCompany();

  const [tab, setTab] = useState<"list" | "schedule">("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("payday");
  const [contractTarget, setContractTarget] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyWithContracts | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = useState<{
    contract: Contract;
    action: "paused" | "ended";
  } | null>(null);

  const paymentsByCompany = useMemo(
    () => groupPaymentsByCompany(paymentsQuery.data ?? []),
    [paymentsQuery.data],
  );

  const payDays = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const company of companiesQuery.data ?? []) {
      map.set(company.id, companyPayDay(company, paymentsByCompany));
    }
    return map;
  }, [companiesQuery.data, paymentsByCompany]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: companiesQuery.data?.length ?? 0,
      active: 0,
      paused: 0,
      ended: 0,
    };
    for (const company of companiesQuery.data ?? []) {
      const status = companyStatus(company);
      if (status !== "none") counts[status] += 1;
    }
    return counts;
  }, [companiesQuery.data]);

  const visibleCompanies = useMemo(() => {
    const filtered = (companiesQuery.data ?? []).filter(
      (company) =>
        statusFilter === "all" || companyStatus(company) === statusFilter,
    );
    return filtered.sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name, "ka");
      const dayA = payDays.get(a.id) ?? 32;
      const dayB = payDays.get(b.id) ?? 32;
      return dayA - dayB || a.name.localeCompare(b.name, "ka");
    });
  }, [companiesQuery.data, statusFilter, sortMode, payDays]);

  const pagination = usePagination(visibleCompanies);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCompany.mutate(
      { id: deleteTarget.id, name: deleteTarget.name },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">კომპანიები</h1>
          <p className="text-sm text-muted-foreground">
            კლიენტები, ხელშეკრულებები და გადახდების განრიგი
          </p>
        </div>
        <CompanyDialog />
      </div>

      <div
        role="tablist"
        aria-label="ხედის არჩევა"
        className="flex w-full gap-1 rounded-lg border border-border bg-muted p-1 sm:w-fit"
      >
        {(
          [
            { value: "list", label: "სია" },
            { value: "schedule", label: "გადახდების განრიგი" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            role="tab"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none",
              tab === option.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "schedule" ? (
        <PaymentSchedule />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TABS.map((filterTab) => (
                <button
                  key={filterTab.value}
                  onClick={() => {
                    setStatusFilter(filterTab.value);
                    pagination.setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                    statusFilter === filterTab.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {filterTab.label}
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {statusCounts[filterTab.value]}
                  </span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
              დალაგება:
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="h-8 rounded-md border border-input bg-card px-2 text-[13px] text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
              >
                <option value="payday">გადახდის რიცხვით</option>
                <option value="name">სახელით</option>
              </select>
            </label>
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
          ) : visibleCompanies.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              ამ ფილტრით კომპანია ვერ მოიძებნა
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pagination.pageItems.map((company) => {
                const payDay = payDays.get(company.id);
                return (
                  <li
                    key={company.id}
                    className="rounded-xl border border-border bg-card px-4 py-3.5 sm:px-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{company.name}</p>
                        <p className="flex flex-wrap items-center gap-x-3 text-xs tabular-nums text-muted-foreground">
                          ს/კ {company.tax_id}
                          {payDay != null && (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <CalendarClock size={11} />
                              იხდის ~{payDay} რიცხვში
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setContractTarget(company)}
                        >
                          <FilePlus2 size={14} />
                          ხელშეკრულება
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label={`${company.name} — წაშლა`}
                          onClick={() => {
                            deleteCompany.reset();
                            setDeleteTarget(company);
                          }}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
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
                );
              })}
            </ul>
          )}

          {companiesQuery.isSuccess && (
            <PaginationControls
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          )}
        </>
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`წაიშალოს „${deleteTarget?.name}"?`}
        description={`წაიშლება მისი ${deleteTarget?.contracts.length ?? 0} ხელშეკრულებაც, მიბმული ტრანზაქციები კი შეუსაბამოში დაბრუნდება. ეს მოქმედება შეუქცევადია.`}
        confirmLabel="წაშლა"
        isPending={deleteCompany.isPending}
        error={deleteCompany.isError ? deleteCompany.error.message : null}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
