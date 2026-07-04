import { describe, expect, it } from "vitest";
import { formatDate, formatGel, formatMonthLabel, getMonthRange } from "@/lib/format";

describe("formatGel", () => {
  it("groups thousands and appends currency", () => {
    expect(formatGel(1500)).toBe("1 500,00 ₾");
    expect(formatGel(4500)).toBe("4 500,00 ₾");
    expect(formatGel(11250)).toBe("11 250,00 ₾");
  });

  it("keeps two decimals", () => {
    expect(formatGel(750.5)).toBe("750,50 ₾");
    expect(formatGel(0)).toBe("0,00 ₾");
  });

  it("renders negative differences with a leading minus", () => {
    expect(formatGel(-2700)).toBe("-2 700,00 ₾");
  });
});

describe("formatMonthLabel / formatDate (locale-independent Georgian)", () => {
  it("labels months without relying on Intl", () => {
    expect(formatMonthLabel("2026-06")).toBe("ივნისი 2026");
    expect(formatMonthLabel("2026-04")).toBe("აპრილი 2026");
  });

  it("formats a day with a short month name", () => {
    expect(formatDate("2026-06-28")).toBe("28 ივნ");
  });
});

describe("getMonthRange", () => {
  it("returns first and last day, accounting for month length", () => {
    expect(getMonthRange("2026-06")).toEqual({ start: "2026-06-01", end: "2026-06-30" });
    expect(getMonthRange("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(getMonthRange("2026-04")).toEqual({ start: "2026-04-01", end: "2026-04-30" });
  });
});
