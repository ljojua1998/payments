import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv";
import { transactionRowSchema } from "@/lib/schemas/data-entry";

describe("parseCsv", () => {
  it("parses headers and rows", () => {
    const rows = parseCsv("doc_key,amount\nBOG-1,1500\nBOG-2,2200");
    expect(rows).toEqual([
      { doc_key: "BOG-1", amount: "1500" },
      { doc_key: "BOG-2", amount: "2200" },
    ]);
  });

  it("respects quoted fields containing commas", () => {
    const rows = parseCsv('doc_key,purpose\nBOG-1,"მომსახურება, ივნისი"');
    expect(rows[0].purpose).toBe("მომსახურება, ივნისი");
  });

  it("strips a BOM and tolerates a semicolon delimiter", () => {
    const rows = parseCsv("﻿doc_key;amount\nBOG-1;1500");
    expect(rows[0]).toEqual({ doc_key: "BOG-1", amount: "1500" });
  });

  it("returns nothing for a header-only file", () => {
    expect(parseCsv("doc_key,amount")).toEqual([]);
  });
});

describe("transactionRowSchema (import validation)", () => {
  const base = {
    doc_key: "BOG-2026-07-001",
    entry_date: "2026-07-03",
    amount: "1500.00",
  };

  it("accepts a valid row and defaults currency to GEL", () => {
    const result = transactionRowSchema.parse(base);
    expect(result.amount).toBe(1500);
    expect(result.currency).toBe("GEL");
    expect(result.sender_inn).toBeNull();
  });

  it("rejects a malformed identification code", () => {
    const result = transactionRowSchema.safeParse({ ...base, sender_inn: "12" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(transactionRowSchema.safeParse({ ...base, amount: "0" }).success).toBe(
      false,
    );
  });

  it("rejects a bad date", () => {
    expect(
      transactionRowSchema.safeParse({ ...base, entry_date: "03/07/2026" })
        .success,
    ).toBe(false);
  });
});
