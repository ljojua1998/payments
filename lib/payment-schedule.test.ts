import { describe, expect, it } from "vitest";
import {
  buildSchedule,
  medianPaymentDay,
  type MatchedPayment,
} from "@/lib/payment-schedule";
import type { Contract, CompanyWithContracts } from "@/lib/types";

function contract(partial: Partial<Contract>): Contract {
  return {
    id: "c",
    company_id: "co",
    monthly_amount: 1000,
    status: "active",
    start_date: "2025-01-01",
    end_date: null,
    ...partial,
  };
}

function company(
  id: string,
  name: string,
  contracts: Contract[],
): CompanyWithContracts {
  return { id, name, tax_id: "000", contracts };
}

describe("medianPaymentDay", () => {
  it("returns the median day-of-month", () => {
    expect(medianPaymentDay(["2026-04-03", "2026-05-05", "2026-06-28"])).toBe(5);
  });
  it("handles a single date", () => {
    expect(medianPaymentDay(["2026-06-15"])).toBe(15);
  });
  it("returns null for no history", () => {
    expect(medianPaymentDay([])).toBeNull();
  });
});

describe("buildSchedule", () => {
  const today = new Date("2026-07-04T12:00:00Z");

  it("excludes companies with no current active contract", () => {
    const companies = [
      company("paused", "შეჩერებული", [
        contract({ status: "paused", end_date: "2026-05-15" }),
      ]),
    ];
    expect(buildSchedule(companies, [], today)).toHaveLength(0);
  });

  it("sums only currently-active contracts into expected", () => {
    const companies = [
      company("eco", "ეკო", [
        contract({ monthly_amount: 750 }),
        contract({ monthly_amount: 1100 }),
      ]),
    ];
    const [row] = buildSchedule(companies, [], today);
    expect(row.expectedAmount).toBe(1850);
  });

  it("marks paid when actual >= expected in the current month", () => {
    const companies = [company("a", "ა", [contract({ monthly_amount: 3100 })])];
    const payments: MatchedPayment[] = [
      { matched_company_id: "a", entry_date: "2026-07-02", amount: 3100 },
    ];
    const [row] = buildSchedule(companies, payments, today);
    expect(row.status).toBe("paid");
    expect(row.paidAmount).toBe(3100);
  });

  it("marks overdue when pay day has passed and nothing paid", () => {
    const companies = [company("g", "გ", [contract({ monthly_amount: 1500 })])];
    // historical payments on the 3rd → pay day 3, today is the 4th, July unpaid
    const payments: MatchedPayment[] = [
      { matched_company_id: "g", entry_date: "2026-05-03", amount: 1500 },
      { matched_company_id: "g", entry_date: "2026-06-03", amount: 1500 },
    ];
    const [row] = buildSchedule(companies, payments, today);
    expect(row.payDay).toBe(3);
    expect(row.status).toBe("overdue");
    expect(row.daysDiff).toBe(-1);
  });

  it("sorts rows by pay day ascending", () => {
    const companies = [
      company("late", "გვიან", [contract({ start_date: "2025-01-20" })]),
      company("early", "ადრე", [contract({ start_date: "2025-01-05" })]),
    ];
    const rows = buildSchedule(companies, [], today);
    expect(rows.map((r) => r.companyId)).toEqual(["early", "late"]);
  });
});
