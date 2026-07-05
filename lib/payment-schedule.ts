import type { CompanyWithContracts, Contract } from "@/lib/types";

export interface MatchedPayment {
  matched_company_id: string;
  entry_date: string;
  amount: number;
}

export type ScheduleStatus = "paid" | "partial" | "upcoming" | "due" | "overdue";

export interface ScheduleRow {
  companyId: string;
  companyName: string;
  taxId: string;
  expectedAmount: number;
  paidAmount: number;
  payDay: number;
  status: ScheduleStatus;
  daysDiff: number;
}

export function medianPaymentDay(dates: string[]): number | null {
  if (dates.length === 0) return null;
  const days = dates
    .map((date) => Number(date.slice(8, 10)))
    .sort((a, b) => a - b);
  return days[Math.floor((days.length - 1) / 2)];
}

function isContractCurrent(contract: Contract, todayIso: string): boolean {
  return (
    contract.status === "active" &&
    contract.start_date <= todayIso &&
    (!contract.end_date || contract.end_date >= todayIso)
  );
}

export function companyPayDay(
  company: CompanyWithContracts,
  paymentsByCompany: Map<string, MatchedPayment[]>,
): number | null {
  const historical = medianPaymentDay(
    (paymentsByCompany.get(company.id) ?? []).map((p) => p.entry_date),
  );
  if (historical !== null) return historical;

  const firstContract = [...company.contracts].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  )[0];
  return firstContract ? Number(firstContract.start_date.slice(8, 10)) : null;
}

export function groupPaymentsByCompany(
  payments: MatchedPayment[],
): Map<string, MatchedPayment[]> {
  const map = new Map<string, MatchedPayment[]>();
  for (const payment of payments) {
    const list = map.get(payment.matched_company_id);
    if (list) list.push(payment);
    else map.set(payment.matched_company_id, [payment]);
  }
  return map;
}

export function buildSchedule(
  companies: CompanyWithContracts[],
  payments: MatchedPayment[],
  today: Date,
): ScheduleRow[] {
  const todayIso = today.toISOString().slice(0, 10);
  const monthPrefix = todayIso.slice(0, 7);
  const todayDay = Number(todayIso.slice(8, 10));
  const paymentsByCompany = groupPaymentsByCompany(payments);

  const rows: ScheduleRow[] = [];

  for (const company of companies) {
    const currentContracts = company.contracts.filter((contract) =>
      isContractCurrent(contract, todayIso),
    );
    if (currentContracts.length === 0) continue;

    const expectedAmount = currentContracts.reduce(
      (sum, contract) => sum + Number(contract.monthly_amount),
      0,
    );
    const paidAmount = (paymentsByCompany.get(company.id) ?? [])
      .filter((payment) => payment.entry_date.startsWith(monthPrefix))
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const payDay = companyPayDay(company, paymentsByCompany) ?? 1;
    const daysDiff = payDay - todayDay;

    let status: ScheduleStatus;
    if (paidAmount >= expectedAmount) status = "paid";
    else if (paidAmount > 0) status = "partial";
    else if (daysDiff > 0) status = "upcoming";
    else if (daysDiff === 0) status = "due";
    else status = "overdue";

    rows.push({
      companyId: company.id,
      companyName: company.name,
      taxId: company.tax_id,
      expectedAmount,
      paidAmount,
      payDay,
      status,
      daysDiff,
    });
  }

  return rows.sort((a, b) => a.payDay - b.payDay);
}
