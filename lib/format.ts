const gelFormatter = new Intl.NumberFormat("ka-GE", {
  style: "currency",
  currency: "GEL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("ka-GE", {
  day: "numeric",
  month: "short",
});

const monthFormatter = new Intl.DateTimeFormat("ka-GE", {
  month: "long",
  year: "numeric",
});

export function formatGel(amount: number): string {
  return gelFormatter.format(amount);
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

export function formatMonthLabel(month: string): string {
  return monthFormatter.format(new Date(`${month}-01T00:00:00`));
}

export function getMonthRange(month: string): { start: string; end: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${lastDay}` };
}
